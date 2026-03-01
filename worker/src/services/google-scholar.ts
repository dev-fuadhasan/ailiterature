import axios from "axios";

const SCRAPINGDOG_KEY = process.env.SCRAPINGDOG_API_KEY || "";
const BASE_URL = "https://api.scrapingdog.com/google_scholar";

export interface GoogleScholarPaper {
  title: string;
  doi: string | null;
  authors: { name: string }[];
  year: number | null;
  journal: string | null;
  abstract: string | null;        // GS snippet (1-2 sentences)
  citationCount: number | null;   // Google's own citation count
  pdfUrl: string | null;          // Direct PDF link if GS surfaces it
  gsUrl: string | null;           // GS result page link
  gsRank: number;                 // Position in GS results (1 = most relevant)
  externalIds: Record<string, string>;
}

interface RawGSResult {
  title?: string;
  link?: string;
  displayed_link?: string;
  snippet?: string;
  publication_info?: {
    summary?: string;
    authors?: { name: string; link?: string }[];
  };
  cited_by?: { total?: number | string };
  resources?: { file_format?: string; type?: string; link?: string }[];
  inline_links?: { cited_by?: { total?: number | string } };
}

function extractYear(summary: string): number | null {
  const match = summary.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

function extractJournal(summary: string): string | null {
  const sepIdx = summary.indexOf(" - ");
  if (sepIdx === -1) return null;
  const rest = summary.slice(sepIdx + 3).trim(); // everything after first " - "
  const secondSep = rest.lastIndexOf(" - ");
  const journalWithYear = secondSep !== -1 ? rest.slice(0, secondSep).trim() : rest;
  const journalPart = journalWithYear.replace(/,?\s*(19|20)\d{2}\s*$/, "").trim();
  return journalPart || null;
}

function extractAuthorsFromSummary(summary: string): { name: string }[] {
  const sepIdx = summary.indexOf(" - ");
  if (sepIdx === -1) return [];
  const authorPart = summary.slice(0, sepIdx).trim();
  if (!authorPart) return [];

  const tokens = authorPart.split(",").map((t) => t.trim()).filter(Boolean);

  const namePattern = /[A-Z]/;
  const results: { name: string }[] = [];
  for (const token of tokens) {
    if (!token || token.length < 2 || token.length > 60) continue;
    if (/^\d/.test(token)) continue;
    if (!namePattern.test(token)) continue;
    const clean = token.replace(/\s*et al\.?$/i, "").trim();
    if (clean.length > 1) results.push({ name: clean });
    if (results.length >= 20) break;
  }
  return results;
}

function extractDoi(link: string): string | null {
  const doiMatch = link.match(/10\.\d{4,}\/[^\s&?#]+/);
  return doiMatch ? doiMatch[0].replace(/[.)]+$/, "") : null;
}

async function fetchOnePage(
  query: string,
  yearFrom: number,
  yearTo: number,
  page: number
): Promise<RawGSResult[]> {
  if (!SCRAPINGDOG_KEY) return [];

  try {
    const resp = await axios.get(BASE_URL, {
      params: {
        api_key: SCRAPINGDOG_KEY,
        query,
        results: "100",
        page: String(page),
        language: "en",
        as_ylo: String(yearFrom),
        as_yhi: String(yearTo),
      },
      timeout: 30000,
    });

    const data = resp.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.organic_results)) return data.organic_results;
    if (Array.isArray(data?.scholar_results)) return data.scholar_results;
    return [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429")) {
      console.warn("[GS] ScrapingDog rate limit hit — stopping pagination");
    } else {
      console.warn("[GS] Fetch error (page", page, "):", msg);
    }
    return [];
  }
}

function parseCitationCount(val: number | string | null | undefined): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  // Handles strings like "Cited by 191" or "191"
  const m = String(val).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function parsePdfResource(resources: RawGSResult["resources"]): string | null {
  if (!resources) return null;
  for (const r of resources) {
    const fmt = (r.file_format || r.type || "").toUpperCase();
    if (fmt === "PDF" || r.link?.toLowerCase().endsWith(".pdf")) return r.link || null;
  }
  return null;
}

function normalizeResult(raw: RawGSResult, rank: number): GoogleScholarPaper | null {
  if (!raw.title) return null;

  // GS API sometimes has summary in publication_info.summary, sometimes only in displayed_link.
  // Use displayed_link as primary metadata string (has authors, journal, year);
  // fall back to publication_info.summary.
  const metaStr =
    raw.displayed_link ||
    raw.publication_info?.summary ||
    "";

  const link = raw.link || "";
  const doi = extractDoi(link) || (raw.title ? extractDoi(raw.title) : null);

  const citedBy =
    raw.cited_by?.total ??
    raw.inline_links?.cited_by?.total ??
    null;

  const gsAuthors = (raw.publication_info?.authors || []).map((a) => ({ name: a.name }));
  const authors = gsAuthors.length > 0 ? gsAuthors : extractAuthorsFromSummary(metaStr);

  return {
    title: raw.title.trim(),
    doi,
    authors,
    year: extractYear(metaStr),
    journal: extractJournal(metaStr),
    abstract: raw.snippet?.trim() || null,
    citationCount: parseCitationCount(citedBy),
    pdfUrl: parsePdfResource(raw.resources),
    gsUrl: link || null,
    gsRank: rank,
    externalIds: doi ? { DOI: doi } : {},
  };
}

export async function searchGoogleScholar(
  topic: string,
  yearFrom: number,
  yearTo: number,
  maxResults = 200
): Promise<GoogleScholarPaper[]> {
  if (!SCRAPINGDOG_KEY) {
    console.warn("[GS] SCRAPINGDOG_API_KEY not set — skipping Google Scholar");
    return [];
  }

  const queries = [
    topic.trim(),
    `${topic.trim()} review`,
    `${topic.trim()} open access`,
  ];

  const allRaw: RawGSResult[] = [];

  for (const query of queries) {
    const pagesToFetch = Math.max(1, Math.ceil(maxResults / (queries.length * 100)));
    for (let page = 0; page < pagesToFetch; page++) {
      const results = await fetchOnePage(query, yearFrom, yearTo, page);
      if (results.length === 0) break;
      allRaw.push(...results);
    }
  }

  const seen = new Set<string>();
  const papers: GoogleScholarPaper[] = [];

  for (const raw of allRaw) {
    const normalized = normalizeResult(raw, papers.length + 1);
    if (!normalized) continue;

    const key = normalized.doi
      ? `doi:${normalized.doi.toLowerCase()}`
      : `title:${normalized.title.toLowerCase().slice(0, 60)}`;

    if (!seen.has(key)) {
      seen.add(key);
      normalized.gsRank = papers.length + 1;
      papers.push(normalized);
    }
  }

  console.log(`[GS] Total unique Google Scholar papers: ${papers.length}`);
  return papers.slice(0, maxResults);
}

/**
 * Enrich a list of GS papers by looking them up in the 6 academic APIs.
 * Returns a map of DOI/title-key → enriched fields (abstract, pdfUrl, citationCount).
 */
export interface EnrichmentData {
  abstract: string | null;
  pdfUrl: string | null;
  citationCount: number | null;
  s3Key?: string | null;
}

export async function enrichFromSources(
  papers: GoogleScholarPaper[],
  enrichmentFetcher: (doi: string | null, title: string) => Promise<EnrichmentData>
): Promise<Map<string, EnrichmentData>> {
  const map = new Map<string, EnrichmentData>();

  // Process in batches of 10 to avoid overwhelming APIs
  const BATCH = 10;
  for (let i = 0; i < papers.length; i += BATCH) {
    const batch = papers.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (p) => {
        const key = p.doi
          ? `doi:${p.doi.toLowerCase()}`
          : `title:${p.title.toLowerCase().slice(0, 60)}`;
        const enriched = await enrichmentFetcher(p.doi, p.title);
        return { key, enriched };
      })
    );
    for (const { key, enriched } of results) {
      map.set(key, enriched);
    }
  }

  return map;
}
