import axios from "axios";
import * as cheerio from "cheerio";
import pdfParse from "pdf-parse";
import { isKnownOAUrl } from "./google-scholar";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 40 * 1024 * 1024;

const client = axios.create({
  timeout: 20_000,
  headers: {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
  maxRedirects: 5,
});

export interface PaperInput {
  title: string;
  authors: string[];
  year: number;
  doi?: string;
  landing_url: string;
  source?: string;
  /** When true, only the OA PDF Downloader and direct GS PDF links are tried.
   *  Unpaywall, OpenAlex, Semantic Scholar, and HTML scraping are skipped.
   *  Set to false (default) to enable all fallback sources. */
  skipFallbackApis?: boolean;
}

export type ResolveStatus = "DOWNLOADED" | "FOUND_LINK_ONLY" | "NO_PUBLIC_PDF" | "FAILED";

export interface ResolveOutput {
  status: ResolveStatus;
  pdf_url: string | null;
  final_url: string | null;
  file_path: string | null;
  reason: string | null;
  evidence: {
    method: "unpaywall" | "meta_tag" | "html_link" | "headless_click" | null;
    matched_selector_or_tag: string | null;
  };
}

export interface ResolvedPdfDownload {
  buffer: Buffer;
  text: string;
  pageCount: number;
  pdfUrl: string;
  abstractHint: string | null;
}

interface Candidate {
  url: string;
  method: ResolveOutput["evidence"]["method"];
  selector: string;
}

function toAbsoluteUrl(href: string, baseUrl: string): string | null {
  try {
    const absolute = new URL(href, baseUrl);
    if (!absolute.protocol.startsWith("http")) return null;
    return absolute.toString();
  } catch {
    return null;
  }
}

function normalizeDoi(doi?: string): string | undefined {
  if (!doi) return undefined;
  return doi.replace(/^https?:\/\/doi\.org\//i, "").trim() || undefined;
}

function looksLikePdf(url: string): boolean {
  const lowered = url.toLowerCase();
  return (
    lowered.endsWith(".pdf") ||
    lowered.includes("/pdf") ||
    lowered.includes("download") ||
    lowered.includes("fulltext") ||
    lowered.includes("content_type=application%2fpdf")
  );
}

async function fetchUnpaywallCandidate(doi?: string): Promise<Candidate | null> {
  const cleanDoi = normalizeDoi(doi);
  const email = process.env.UNPAYWALL_EMAIL;
  if (!cleanDoi || !email) return null;

  try {
    const response = await client.get(
      `https://api.unpaywall.org/v2/${encodeURIComponent(cleanDoi)}?email=${encodeURIComponent(email)}`,
      { validateStatus: (status) => status < 500 }
    );

    if (response.status !== 200) return null;

    const urlForPdf = response.data?.best_oa_location?.url_for_pdf;
    if (!urlForPdf) return null;

    return {
      url: String(urlForPdf),
      method: "unpaywall",
      selector: "best_oa_location.url_for_pdf",
    };
  } catch {
    return null;
  }
}

async function fetchOpenAlexCandidate(doi?: string): Promise<Candidate | null> {
  const cleanDoi = normalizeDoi(doi);
  if (!cleanDoi) return null;

  try {
    const response = await client.get("https://api.openalex.org/works", {
      params: {
        filter: `doi:https://doi.org/${cleanDoi}`,
        per_page: 1,
      },
      validateStatus: (status) => status < 500,
    });

    const work = Array.isArray(response.data?.results) ? response.data.results[0] : null;
    const pdfUrl = work?.best_oa_location?.pdf_url || work?.open_access?.oa_url || null;
    if (!pdfUrl) return null;

    return {
      url: String(pdfUrl),
      method: "html_link",
      selector: "openalex.best_oa_location.pdf_url",
    };
  } catch {
    return null;
  }
}

async function fetchSemanticScholarCandidate(doi?: string): Promise<Candidate | null> {
  const cleanDoi = normalizeDoi(doi);
  if (!cleanDoi) return null;

  try {
    const response = await client.get(`https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(cleanDoi)}`, {
      params: {
        fields: "openAccessPdf,url",
      },
      validateStatus: (status) => status < 500,
    });

    const pdfUrl = response.data?.openAccessPdf?.url || null;
    if (!pdfUrl) return null;

    return {
      url: String(pdfUrl),
      method: "html_link",
      selector: "semanticScholar.openAccessPdf.url",
    };
  } catch {
    return null;
  }
}

/**
 * Calls the OA PDF Downloader service (https://oa-pdf-downloader.vercel.app/api/find-pdf)
 * with the article's landing page URL (title_link from Google Scholar).
 * Returns a direct PDF URL if found. Handles both open-access and browser-required cases.
 */
async function fetchOaPdfDownloaderCandidate(titleLinkUrl: string): Promise<Candidate | null> {
  if (!titleLinkUrl) return null;

  try {
    const response = await axios.post(
      "https://oa-pdf-downloader.vercel.app/api/find-pdf",
      { url: titleLinkUrl },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 25_000,
        validateStatus: (status) => status < 500,
      }
    );

    if (response.status !== 200 || !response.data?.success) {
      console.warn(
        `[OAPDFDownloader] Miss for ${titleLinkUrl} — HTTP ${response.status}`,
        `success=${response.data?.success}`,
        `error=${response.data?.error ?? "(none)"}`,
        `pdfUrl=${response.data?.pdfUrl ?? "(none)"}`,
      );
      return null;
    }

    const pdfUrl: string | undefined = response.data.pdfUrl;
    if (!pdfUrl) {
      console.warn(`[OAPDFDownloader] success=true but no pdfUrl for ${titleLinkUrl}`);
      return null;
    }

    if (response.data.requiresBrowser) {
      console.log(`[OAPDFDownloader] requiresBrowser=true for ${titleLinkUrl} — skipping (browser-gated URL)`);
      return null;
    }

    console.log(`[OAPDFDownloader] ✓ Found PDF for ${titleLinkUrl} → ${pdfUrl}`);

    return {
      url: pdfUrl,
      method: "html_link",
      selector: `oa-pdf-downloader:${response.data.journal || "unknown"}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[OAPDFDownloader] Error for", titleLinkUrl, ":", msg);
    return null;
  }
}

function extractCandidatesFromHtml(html: string, baseUrl: string): Candidate[] {
  const $ = cheerio.load(html);
  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  const pushCandidate = (href: string | undefined, method: Candidate["method"], selector: string) => {
    if (!href) return;
    const absolute = toAbsoluteUrl(href, baseUrl);
    if (!absolute || seen.has(absolute) || !looksLikePdf(absolute)) return;
    seen.add(absolute);
    candidates.push({ url: absolute, method, selector });
  };

  pushCandidate($('meta[name="citation_pdf_url"]').attr("content"), "meta_tag", 'meta[name="citation_pdf_url"]');
  pushCandidate($('link[rel="alternate"][type="application/pdf"]').attr("href"), "meta_tag", 'link[rel="alternate"][type="application/pdf"]');

  $("a[href]").each((_, element) => {
    pushCandidate($(element).attr("href"), "html_link", "a[href]");
  });

  const scriptRegex = /https?:\/\/[^"'\s>]+\.pdf(?:\?[^"'\s>]*)?/gi;
  const scriptMatches = html.match(scriptRegex) || [];
  for (const match of scriptMatches) {
    pushCandidate(match, "html_link", "script/pdf-regex");
  }

  return candidates;
}

async function fetchHtmlCandidates(landingUrl: string): Promise<Candidate[]> {
  if (!landingUrl) return [];

  try {
    const response = await client.get(landingUrl, {
      responseType: "text",
      maxContentLength: MAX_HTML_BYTES,
      validateStatus: (status) => status < 500,
    });

    if (response.status >= 400 || typeof response.data !== "string") return [];
    return extractCandidatesFromHtml(response.data, landingUrl);
  } catch {
    return [];
  }
}

async function isValidPdfUrl(url: string): Promise<boolean> {
  try {
    const head = await client.head(url, {
      validateStatus: (status) => status < 500,
      timeout: 12_000,
    });
    const contentType = String(head.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("application/pdf")) return true;
    if (contentType.includes("text/html")) return false;
  } catch {
    // fall through to byte sniff
  }

  try {
    const probe = await client.get(url, {
      responseType: "arraybuffer",
      headers: { Range: "bytes=0-4095", Accept: "application/pdf,*/*" },
      maxContentLength: 4096,
      validateStatus: (status) => status < 500,
      timeout: 15_000,
    });

    const buffer = Buffer.from(probe.data as ArrayBuffer);
    return buffer.slice(0, 4).toString("ascii") === "%PDF";
  } catch {
    return false;
  }
}

async function downloadPdf(url: string): Promise<ResolvedPdfDownload | null> {
  try {
    const response = await client.get(url, {
      responseType: "arraybuffer",
      headers: {
        Accept: "application/pdf,application/octet-stream,*/*;q=0.8",
        Referer: "https://scholar.google.com/",
      },
      maxContentLength: MAX_PDF_BYTES,
      timeout: 90_000,
      validateStatus: (status) => status < 500,
    });

    if (response.status >= 400) return null;

    const buffer = Buffer.from(response.data as ArrayBuffer);
    if (buffer.slice(0, 4).toString("ascii") !== "%PDF") return null;

    const parsed = await pdfParse(buffer);
    const text = (parsed.text || "").trim();
    if (text.length < 1200) return null;

    const abstractMatch = text.match(/\babstract\b([\s\S]{0,1800})\b(introduction|keywords|methods?|materials?)\b/i);
    const abstractHint = abstractMatch ? abstractMatch[1].replace(/\s+/g, " ").trim() : null;

    return {
      buffer,
      text,
      pageCount: parsed.numpages || 0,
      pdfUrl: url,
      abstractHint: abstractHint || null,
    };
  } catch {
    return null;
  }
}

function dedupeCandidates(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    out.push(candidate);
  }

  return out;
}

export async function resolveAndFetchPdf(
  paper: PaperInput & { directPdfUrl?: string }
): Promise<ResolvedPdfDownload | null> {
  const candidates: Candidate[] = [];
  const titleShort = paper.title.slice(0, 60);
  console.log(`[Resolver] "${titleShort}" | landing=${paper.landing_url || "(none)"} | doi=${paper.doi || "(none)"} | directPdf=${paper.directPdfUrl || "(none)"}`);

  // 1. Direct PDF link surfaced by Google Scholar (highest priority)
  if (paper.directPdfUrl && looksLikePdf(paper.directPdfUrl)) {
    candidates.push({
      url: paper.directPdfUrl,
      method: "html_link",
      selector: "google_scholar.resource_pdf",
    });
  }

  // 2. OA PDF Downloader — use the article landing page (title_link) to resolve a direct PDF URL.
  //    This is run concurrently with optional fallback OA database lookups.
  if (paper.skipFallbackApis) {
    // Phase 1: OA PDF Downloader only — skip expensive fallback API calls
    const fromOaPdfDownloader = paper.landing_url
      ? await fetchOaPdfDownloaderCandidate(paper.landing_url)
      : null;
    if (fromOaPdfDownloader) candidates.push(fromOaPdfDownloader);
  } else {
    // Phase 2 (or full resolve): OA PDF Downloader + all fallback sources
    const [fromOaPdfDownloader, fromUnpaywall, fromOpenAlex, fromSemanticScholar, fromHtml] =
      await Promise.all([
        paper.landing_url ? fetchOaPdfDownloaderCandidate(paper.landing_url) : Promise.resolve(null),
        fetchUnpaywallCandidate(paper.doi),
        fetchOpenAlexCandidate(paper.doi),
        fetchSemanticScholarCandidate(paper.doi),
        fetchHtmlCandidates(paper.landing_url),
      ]);
    if (fromOaPdfDownloader) candidates.push(fromOaPdfDownloader);
    if (fromUnpaywall) candidates.push(fromUnpaywall);
    if (fromOpenAlex) candidates.push(fromOpenAlex);
    if (fromSemanticScholar) candidates.push(fromSemanticScholar);
    candidates.push(...fromHtml);
  }

  const uniqueCandidates = dedupeCandidates(candidates).slice(0, 15);
  const titleShort2 = paper.title.slice(0, 60);
  console.log(`[Resolver] "${titleShort2}" — ${uniqueCandidates.length} candidate(s): ${uniqueCandidates.map((c) => c.selector).join(", ") || "(none)"}`);

  for (const candidate of uniqueCandidates) {
    // Skip HEAD/byte-sniff validation when:
    //   - URL came from the OA PDF Downloader (it already verified the link)
    //   - URL belongs to a known OA domain (publisher anti-hotlinking blocks Range requests
    //     without a Referer, causing false negatives — the browser works fine because it
    //     sends Referer automatically)
    const trustedCandidate =
      candidate.selector.startsWith("oa-pdf-downloader:") ||
      isKnownOAUrl(candidate.url);

    if (!trustedCandidate) {
      const valid = await isValidPdfUrl(candidate.url);
      if (!valid) {
        console.log(`[Resolver]   ✗ not a valid PDF: ${candidate.url.slice(0, 100)}`);
        continue;
      }
    } else {
      console.log(`[Resolver]   → trusted OA URL, skipping validation: ${candidate.url.slice(0, 80)}`);
    }

    const downloaded = await downloadPdf(candidate.url);
    if (downloaded) {
      console.log(`[Resolver]   ✓ downloaded ${downloaded.pageCount}p / ${downloaded.text.length} chars via ${candidate.selector}`);
      return downloaded;
    }
    console.log(`[Resolver]   ✗ download failed or text too short: ${candidate.url.slice(0, 100)}`);
  }

  console.log(`[Resolver] "${titleShort2}" — NO PDF found`);
  return null;
}

export async function resolvePdfUrl(paper: PaperInput): Promise<ResolveOutput> {
  const downloaded = await resolveAndFetchPdf(paper);

  if (!downloaded) {
    return {
      status: "NO_PUBLIC_PDF",
      pdf_url: null,
      final_url: null,
      file_path: null,
      reason: "No free downloadable PDF could be resolved from OA sources or page scraping",
      evidence: { method: null, matched_selector_or_tag: null },
    };
  }

  return {
    status: "DOWNLOADED",
    pdf_url: downloaded.pdfUrl,
    final_url: downloaded.pdfUrl,
    file_path: null,
    reason: null,
    evidence: { method: "html_link", matched_selector_or_tag: "resolveAndFetchPdf" },
  };
}
