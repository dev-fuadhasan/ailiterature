import axios from "axios";

const SCRAPINGDOG_KEY = process.env.SCRAPINGDOG_API_KEY || "";
const BASE_URL = "https://api.scrapingdog.com/google_scholar";

// ---------------------------------------------------------------------------
// Known open-access domain patterns — used to prioritise PDF resolution.
// Papers whose gsUrl matches any pattern are processed first by the OA PDF
// Downloader API (they are far more likely to yield a free full-text PDF).
// ---------------------------------------------------------------------------
const OA_DOMAIN_PATTERNS: RegExp[] = [
  // Group 1 — Major Publishers & Aggregators
  /pmc\.ncbi\.nlm\.nih\.gov/,
  /pubmed\.ncbi\.nlm\.nih\.gov/,
  /arxiv\.org/,
  /biorxiv\.org/,
  /medrxiv\.org/,
  /journals\.plos\.org/,
  /springeropen\.com/,
  /biomedcentral\.com/,
  /nature\.com\/articles\//,
  // Group 2 — Elsevier / ScienceDirect
  /sciencedirect\.com/,
  // Group 3 — Frontiers
  /frontiersin\.org/,
  // Group 4 — MDPI
  /mdpi\.com/,
  // Group 5 — Wiley / Hindawi
  /onlinelibrary\.wiley\.com/,
  /hindawi\.com/,
  // Group 6 — IEEE & ACM
  /ieeexplore\.ieee\.org/,
  /dl\.acm\.org/,
  // Group 7 — Repositories & Preprint Servers
  /zenodo\.org/,
  /europepmc\.org/,
  /semanticscholar\.org/,
  /researchgate\.net/,
  /ssrn\.com/,
  /osf\.io\/preprints\//,
  /chemrxiv\.org/,
  // Group 8 — Institutional & Regional OA
  /doaj\.org/,
  /scielo\.(br|org)/,
  /ajol\.info/,
  /eric\.ed\.gov/,
  /core\.ac\.uk/,
  /base-search\.net/,
  // Group 9 — Specialty / Domain Journals
  /elifesciences\.org/,
  /peerj\.com/,
  /f1000research\.com/,
  /royalsocietypublishing\.org/,
  /academic\.oup\.com/,
  /cambridge\.org\/core/,
  /tandfonline\.com/,
  /journals\.sagepub\.com/,
  /egusphere\.net/,
  /geoscientificmodeldev\.net/,
];

/** Returns true if the URL belongs to a known open-access domain. */
export function isKnownOAUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return OA_DOMAIN_PATTERNS.some((pattern) => pattern.test(url));
}

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
  title_link?: string;  // ScrapingDog Google Scholar primary article URL
  link?: string;        // fallback / alternate URL field
  displayed_link?: string;
  snippet?: string;
  // ScrapingDog returns authors at the TOP LEVEL (not inside publication_info)
  authors?: { name: string; link?: string; author_id?: string; scrapingdog_link?: string }[];
  publication_info?: {
    summary?: string;
    authors?: { name: string; link?: string }[];
  };
  cited_by?: { total?: number | string };
  resources?: { file_format?: string; type?: string; link?: string }[];
  inline_links?: { cited_by?: { total?: number | string } };
  id?: string; // ScrapingDog cluster/result id
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

  // ScrapingDog returns the article landing page as "title_link"; fall back to "link"
  const link = raw.title_link || raw.link || "";
  const doi = extractDoi(link) || (raw.title ? extractDoi(raw.title) : null);

  const citedBy =
    raw.cited_by?.total ??
    raw.inline_links?.cited_by?.total ??
    null;

  // ScrapingDog puts authors at the top level; fall back to publication_info, then parse displayed_link
  const topLevelAuthors = (raw.authors || []).filter((a) => a.name).map((a) => ({ name: a.name }));
  const pubInfoAuthors = (raw.publication_info?.authors || []).map((a) => ({ name: a.name }));
  const authors =
    topLevelAuthors.length > 0
      ? topLevelAuthors
      : pubInfoAuthors.length > 0
      ? pubInfoAuthors
      : extractAuthorsFromSummary(metaStr);

  // Year: prefer explicit year in displayed_link/summary; ScrapingDog embeds it there
  const year = extractYear(metaStr);

  // Journal: extracted from displayed_link ("Authors - Journal, Year - domain")
  const journal = extractJournal(metaStr);

  return {
    title: raw.title.trim(),
    doi,
    authors,
    year,
    journal,
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
  maxResults = 200,
  topicVariations?: string[]  // NEW: Optional AI-generated topic variations
): Promise<GoogleScholarPaper[]> {
  if (!SCRAPINGDOG_KEY) {
    console.warn("[GS] SCRAPINGDOG_API_KEY not set — skipping Google Scholar");
    return [];
  }

  let queries: string[];
  
  if (topicVariations && topicVariations.length > 0) {
    // Use AI-generated topic variations for searching
    queries = topicVariations;
    console.log(`[GS] Using ${queries.length} AI-generated topic variations`);
  } else {
    // Fallback: Build up to three complementary queries (original behavior):
    //   1. Full title (exact user input)  — always
    //   2. First half of words           — only when title has > 6 words
    //   3. Last half of words            — only when title has > 6 words
    //
    // Short titles (≤ 6 words) are NOT split: fragments like "Healthcare in" or
    // "education" produce irrelevant GS results (textbooks, unrelated domains)
    // that pollute the candidate pool and waste OA downloader credits.
    const fullTitle = topic.trim();
    const words = fullTitle.split(/\s+/).filter(Boolean);

    queries = [fullTitle];

    if (words.length > 6) {
      const mid = Math.ceil(words.length / 2);
      const firstHalf = words.slice(0, mid).join(" ");
      const lastHalf  = words.slice(mid).join(" ");
      if (firstHalf && firstHalf !== fullTitle) queries.push(firstHalf);
      if (lastHalf  && lastHalf  !== fullTitle && lastHalf !== firstHalf) queries.push(lastHalf);
    }
  }

  console.log(`[GS] Search queries (${queries.length}): ${queries.map((q) => `"${q}"`).join(", ")}`);

  // Distribute page budget evenly across queries
  const pagesToFetch = Math.max(1, Math.ceil((maxResults * 1.5) / (100 * queries.length)));

  const allRaw: RawGSResult[] = [];

  for (const query of queries) {
    for (let page = 0; page < pagesToFetch; page++) {
      const results = await fetchOnePage(query, yearFrom, yearTo, page);
      console.log(`[GS] Query "${query}" page ${page}: ${results.length} results`);
      if (results.length === 0) break;
      allRaw.push(...results);
      // Stop early once we have more than enough raw material from all queries
      if (allRaw.length >= maxResults * 4) break;
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
