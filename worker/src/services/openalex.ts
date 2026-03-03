import axios from "axios";
import type { GoogleScholarPaper } from "./google-scholar";

// ─── OpenAlex Search ──────────────────────────────────────────────────────
// OpenAlex: free, open catalog of 200M+ scholarly works. No API key needed.
// Polite pool (higher rate limits): add your email as mailto param.
// Docs: https://docs.openalex.org/api-entities/works/filter-works
//
// NOTE: content.openalex.org PDF download costs $0.01/file — we do NOT use it.
// Instead we use best_oa_location.pdf_url which is a direct free external URL.

const BASE_URL = "https://api.openalex.org/works";
const MAILTO   = process.env.OPENALEX_EMAIL || "research@literatureai.app";

// Fields we request from the API — keep minimal for speed
const SELECT_FIELDS = [
  "id", "title", "doi", "authorships", "publication_year",
  "primary_location", "best_oa_location", "locations",
  "open_access", "cited_by_count", "abstract_inverted_index",
  "language", "type",
].join(",");

// ─── Types ────────────────────────────────────────────────────────────────
interface OALocation {
  is_oa: boolean;
  pdf_url:          string | null;
  landing_page_url: string | null;
  version:          string | null;
}

interface OpenAlexWork {
  id:               string;
  title:            string | null;
  doi:              string | null;
  type:             string | null;
  language:         string | null;
  authorships:      Array<{ author: { display_name: string } }>;
  publication_year: number | null;
  primary_location: {
    source?: { display_name?: string } | null;
    landing_page_url?: string | null;
    pdf_url?:          string | null;
    is_oa?:            boolean;
  } | null;
  best_oa_location: OALocation | null;
  locations:        OALocation[] | null;
  open_access: {
    is_oa:   boolean;
    oa_url?: string | null;
    oa_status?: string | null;
  } | null;
  cited_by_count:            number;
  abstract_inverted_index:   Record<string, number[]> | null;
}

// ─── Abstract reconstruction ──────────────────────────────────────────────
// OpenAlex stores abstracts as an inverted index {word: [positions]}.
// We rebuild the original text by placing each word at its positions.
function reconstructAbstract(index: Record<string, number[]> | null | undefined): string | null {
  if (!index) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) words[pos] = word;
  }
  const text = words.filter(Boolean).join(" ").trim();
  return text.length > 20 ? text : null;
}

// ─── Best PDF URL extractor ───────────────────────────────────────────────
// Priority: best_oa_location (published/accepted) > any OA location > primary > oa_url
function extractBestPdfUrl(work: OpenAlexWork): string | null {
  // 1. Best OA location with a direct PDF link (highest quality)
  if (work.best_oa_location?.pdf_url) return work.best_oa_location.pdf_url;

  // 2. Any other location that is OA and has a PDF
  if (work.locations) {
    const oaWithPdf = work.locations.find(l => l.is_oa && l.pdf_url);
    if (oaWithPdf?.pdf_url) return oaWithPdf.pdf_url;
  }

  // 3. Primary location PDF (may or may not be OA)
  if (work.primary_location?.pdf_url) return work.primary_location.pdf_url;

  // 4. OA URL (landing page, not a direct PDF but often resolvable)
  if (work.open_access?.oa_url) return work.open_access.oa_url;

  return null;
}

// ─── Best landing URL extractor ───────────────────────────────────────────
function extractLandingUrl(work: OpenAlexWork, doi: string | null): string | null {
  return (
    work.best_oa_location?.landing_page_url ||
    work.primary_location?.landing_page_url ||
    (doi ? `https://doi.org/${doi}` : null) ||
    work.id
  );
}

// ─── API fetch ────────────────────────────────────────────────────────────
async function fetchOpenAlexPage(
  query:    string,
  yearFrom: number,
  yearTo:   number,
  oaOnly:   boolean,
  perPage:  number,
): Promise<OpenAlexWork[]> {
  // Build filter string using proper OpenAlex filter params:
  //   type:article           → journal articles only
  //   publication_year:X-Y   → year range
  //   language:en            → English papers only
  //   is_retracted:false     → exclude retracted
  //   has_abstract:true      → must have abstract for analysis fallback
  //   open_access.is_oa:true → (optional) OA papers only, have direct PDF URLs
  const filters = [
    `type:article`,
    `publication_year:${yearFrom}-${yearTo}`,
    `language:en`,
    `is_retracted:false`,
    `has_abstract:true`,
    ...(oaOnly ? [`open_access.is_oa:true`] : []),
  ].join(",");

  try {
    const resp = await axios.get<{ results: OpenAlexWork[] }>(BASE_URL, {
      params: {
        search:     query,
        filter:     filters,
        "per-page": perPage,
        page:       1,
        sort:       "cited_by_count:desc",
        select:     SELECT_FIELDS,
        mailto:     MAILTO,
      },
      timeout: 20_000,
      headers: { "User-Agent": `LiteratureAI/1.0 (mailto:${MAILTO})` },
    });
    return resp.data?.results ?? [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[OpenAlex] Fetch failed (oaOnly=${oaOnly}, q="${query.slice(0, 40)}"): ${msg}`);
    return [];
  }
}

// ─── Mapper ───────────────────────────────────────────────────────────────
function mapWork(work: OpenAlexWork, rank: number): GoogleScholarPaper | null {
  if (!work.title?.trim()) return null;

  const doi = work.doi
    ? work.doi.replace("https://doi.org/", "").replace("http://doi.org/", "").trim()
    : null;

  const pdfUrl    = extractBestPdfUrl(work);
  const gsUrl     = extractLandingUrl(work, doi);
  const abstract  = reconstructAbstract(work.abstract_inverted_index);
  const isOA      = work.open_access?.is_oa ?? false;
  const oaStatus  = work.open_access?.oa_status ?? null;

  return {
    title:  work.title.trim(),
    doi,
    authors: (work.authorships ?? [])
      .slice(0, 20)
      .map((a) => ({ name: a.author?.display_name ?? "" }))
      .filter((a) => a.name.length > 0),
    year:          work.publication_year,
    journal:       work.primary_location?.source?.display_name ?? null,
    abstract,
    citationCount: work.cited_by_count ?? null,
    pdfUrl,
    gsUrl,
    gsRank:  rank,
    externalIds: {
      openalexId: work.id,
      ...(doi         ? { doi }         : {}),
      ...(isOA        ? { isOA: "true" } : {}),
      ...(oaStatus    ? { oaStatus }    : {}),
    },
  };
}

// ─── Deduplication helper ─────────────────────────────────────────────────
function deduplicateWorks(works: OpenAlexWork[]): OpenAlexWork[] {
  const seenIds    = new Set<string>();
  const seenDois   = new Set<string>();
  return works.filter((w) => {
    if (seenIds.has(w.id)) return false;
    seenIds.add(w.id);
    if (w.doi) {
      if (seenDois.has(w.doi)) return false;
      seenDois.add(w.doi);
    }
    return true;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────
/**
 * Search OpenAlex for papers matching the topic and year range.
 *
 * Strategy:
 *   • For each query, runs TWO parallel requests:
 *       1. OA-only (open_access.is_oa:true) → papers with direct free PDF URLs
 *       2. All articles → broader coverage for abstract-only analysis
 *   • All variation queries run in parallel.
 *   • Deduplicates by OpenAlex ID + DOI.
 *   • OA papers are returned first in the results so the processor
 *     encounters them first and gets more PDFs downloaded.
 */
export async function searchOpenAlex(
  topic:           string,
  yearFrom:        number,
  yearTo:          number,
  targetCount:     number,
  topicVariations: string[] = [],
): Promise<GoogleScholarPaper[]> {
  const queries  = [topic, ...topicVariations].slice(0, 5); // max 5 topic queries
  const perPage  = Math.min(200, Math.ceil(targetCount / queries.length) + 30);

  console.log(`[OpenAlex] Running ${queries.length * 2} parallel requests (OA + all, ${yearFrom}–${yearTo})...`);

  // For each query: run OA-only AND all-articles in parallel
  const allFetches = queries.flatMap((q) => [
    fetchOpenAlexPage(q, yearFrom, yearTo, true,  perPage),  // OA papers first
    fetchOpenAlexPage(q, yearFrom, yearTo, false, perPage),  // All articles
  ]);

  const rawBatches = await Promise.all(allFetches);
  const oaWorks    = rawBatches.filter((_, i) => i % 2 === 0).flat(); // even = OA-only
  const allWorks   = rawBatches.filter((_, i) => i % 2 === 1).flat(); // odd  = all

  // Deduplicate OA works, then non-OA works separately, then merge (OA first)
  const dedupedOA  = deduplicateWorks(oaWorks);
  const oaIds      = new Set(dedupedOA.map(w => w.id));
  const oaDois     = new Set(dedupedOA.map(w => w.doi).filter(Boolean) as string[]);

  const dedupedAll = deduplicateWorks(
    allWorks.filter(w => !oaIds.has(w.id) && !(w.doi && oaDois.has(w.doi)))
  );

  const merged = [...dedupedOA, ...dedupedAll];

  // Map to GoogleScholarPaper format
  const papers: GoogleScholarPaper[] = [];
  for (let i = 0; i < merged.length; i++) {
    const p = mapWork(merged[i], i);
    if (p) papers.push(p);
  }

  // Deduplicate by normalized title (catches same paper with different IDs)
  const seenTitles = new Set<string>();
  const finalPapers = papers.filter((p) => {
    const norm = p.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seenTitles.has(norm)) return false;
    seenTitles.add(norm);
    return true;
  });

  console.log(
    `[OpenAlex] ✓ ${finalPapers.length} unique papers ` +
    `(${dedupedOA.length} OA with PDF + ${dedupedAll.length} additional) ` +
    `from ${merged.length} raw results`
  );

  return finalPapers.slice(0, targetCount);
}
