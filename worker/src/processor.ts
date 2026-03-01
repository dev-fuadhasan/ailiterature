import { Job } from "bullmq";
import prisma from "./lib/prisma";
import { uploadBuffer } from "./lib/r2";
import { ResearchJobData } from "./lib/queue";
import { searchGoogleScholar, GoogleScholarPaper, isKnownOAUrl } from "./services/google-scholar";
import { analyzePaper, ExtractionResult } from "./services/groq-analyzer";
import { resolveAndFetchPdf } from "./services/pdf-resolver";
import { shouldStop, markShouldStop, clearStop } from "./lib/stop-signal";

const CONCURRENCY = 4;

/**
 * Lightweight CJS-compatible concurrency limiter (replaces p-limit ESM dependency).
 * At most `concurrency` promises run simultaneously; extras are queued.
 */
function createLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  function drain() {
    while (active < concurrency && queue.length > 0) {
      active++;
      const task = queue.shift()!;
      task();
    }
  }

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        Promise.resolve()
          .then(fn)
          .then(resolve, reject)
          .finally(() => { active--; drain(); });
      });
      drain();
    });
  };
}

function slugifyTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function slugifyDoi(doi: string): string {
  return doi.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}

interface RankedCandidate extends GoogleScholarPaper {
  score: number;
  quartile: string;
}

export async function processResearchJob(job: Job<ResearchJobData>): Promise<void> {
  await processResearchData(job.data);
}

export async function processResearchData(data: ResearchJobData): Promise<void> {
  const { projectId, topic, yearFrom, yearTo, maxPapers } = data;
  console.log(`[Worker] Starting project ${projectId}: "${topic}" — target ${maxPapers} fully analyzed PDFs`);

  try {
    await prisma.project.update({ where: { id: projectId }, data: { status: "SEARCHING" } });

    const searchTarget = Math.min(Math.max(maxPapers * 4, 80), 400);
    const gsPapers = await searchGoogleScholar(topic, yearFrom, yearTo, searchTarget);
    console.log(`[Worker] ScrapingDog results: ${gsPapers.length}`);

    {
      const sc = await prisma.project.findUnique({ where: { id: projectId }, select: { stopRequested: true } });
      if (sc?.stopRequested) {
        await markStopped(projectId);
        return;
      }
    }

    const maxCit = Math.max(...gsPapers.map((p) => p.citationCount ?? 0), 1);
    const ranked: RankedCandidate[] = gsPapers
      .map((paper, idx) => {
        const relevance = Math.max(0, 1 - idx / 250);
        const citationSignal = paper.citationCount ? Math.log1p(paper.citationCount) / Math.log1p(maxCit) : 0;
        const recency = paper.year ? Math.max(0, 1 - Math.max(0, new Date().getFullYear() - paper.year) / 12) : 0.4;
        const hasPdf = paper.pdfUrl ? 0.35 : 0;
        const score = relevance * 0.42 + citationSignal * 0.3 + recency * 0.18 + hasPdf * 0.1;
        const quartile = idx / Math.max(gsPapers.length, 1) < 0.25 ? "Q1" : idx / Math.max(gsPapers.length, 1) < 0.5 ? "Q2" : idx / Math.max(gsPapers.length, 1) < 0.75 ? "Q3" : "Q4";
        return { ...paper, score, quartile };
      })
      .sort((a, b) => b.score - a.score);

    // --- OA-domain papers first -------------------------------------------
    // Papers whose landing URL belongs to a known open-access platform are
    // partitioned to the front of the processing queue. Within each partition
    // the existing relevance/citation score order is preserved.
    // This ensures the OA PDF Downloader API is called on the most likely-to-
    // succeed URLs first, maximising throughput and reducing wasted API credits.
    const oaRanked    = ranked.filter((p) => isKnownOAUrl(p.gsUrl));
    const nonOaRanked = ranked.filter((p) => !isKnownOAUrl(p.gsUrl));
    ranked.splice(0, ranked.length, ...oaRanked, ...nonOaRanked);
    console.log(`[Worker] OA-domain papers: ${oaRanked.length} (sent first) | non-OA: ${nonOaRanked.length}`);

    await prisma.project.update({ where: { id: projectId }, data: { status: "DOWNLOADING", totalPapers: maxPapers } });

    let analyzedCount = 0;
    let failedCount = 0;
    const seen = new Set<string>();

    const stopPollInterval = setInterval(async () => {
      try {
        const check = await prisma.project.findUnique({ where: { id: projectId }, select: { stopRequested: true } });
        if (check?.stopRequested) markShouldStop(projectId);
      } catch {
        // noop
      }
    }, 2000);

    /**
     * Keys of candidates that failed in Phase 1 (OA PDF Downloader only) and should be
     * retried in Phase 2 with full fallback APIs (Unpaywall, OpenAlex, Semantic Scholar, HTML).
     */
    const failedDedupeKeys = new Set<string>();

    /**
     * @param skipFallbackApis  true  = Phase 1: OA PDF Downloader + direct GS PDF only.
     *                          false = Phase 2: all fallback APIs enabled.
     */
    async function processCandidate(candidate: RankedCandidate, skipFallbackApis: boolean): Promise<void> {
      if (analyzedCount >= maxPapers || shouldStop(projectId)) return;

      const dedupeKey = candidate.doi
        ? `doi:${candidate.doi.toLowerCase()}`
        : `title:${candidate.title.toLowerCase().slice(0, 90)}`;

      if (skipFallbackApis) {
        // Phase 1: standard dedup — skip papers already seen
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
      } else {
        // Phase 2: only retry papers that failed in Phase 1
        if (!failedDedupeKeys.has(dedupeKey)) return;
        failedDedupeKeys.delete(dedupeKey);
      }

      let paper = candidate.doi
        ? await prisma.paper.findUnique({ where: { doi: candidate.doi } })
        : null;

      if (!paper) {
        paper = await prisma.paper.create({
          data: {
            doi: candidate.doi,
            title: candidate.title,
            authors: candidate.authors,
            year: candidate.year,
            journal: candidate.journal,
            abstract: candidate.abstract,
            citationCount: candidate.citationCount,
            isOpenAccess: !!candidate.pdfUrl,
            pdfUrl: candidate.pdfUrl,
            sourceApi: "google_scholar",
            externalIds: {
              ...candidate.externalIds,
              ...(candidate.gsUrl ? { gsUrl: candidate.gsUrl } : {}),
            },
            quartile: candidate.quartile,
          },
        });
      } else {
        await prisma.paper.update({
          where: { id: paper.id },
          data: {
            quartile: candidate.quartile,
            abstract: paper.abstract || candidate.abstract,
            citationCount: candidate.citationCount ?? paper.citationCount,
            pdfUrl: paper.pdfUrl || candidate.pdfUrl,
            externalIds: {
              ...(paper.externalIds as Record<string, string>),
              ...candidate.externalIds,
              ...(candidate.gsUrl ? { gsUrl: candidate.gsUrl } : {}),
            },
          },
        });
        paper = await prisma.paper.findUnique({ where: { id: paper.id } });
      }

      if (!paper) return;

      await prisma.projectPaper.upsert({
        where: { projectId_paperId: { projectId, paperId: paper.id } },
        create: { projectId, paperId: paper.id, extractionStatus: "PENDING" },
        update: {},
      });

      const existingExtraction = await prisma.extraction.findUnique({ where: { paperId: paper.id } });
      if (existingExtraction && paper.s3Key) {
        analyzedCount++;
        await prisma.projectPaper.update({
          where: { projectId_paperId: { projectId, paperId: paper.id } },
          data: { extractionStatus: "COMPLETED" },
        });
        await prisma.project.update({
          where: { id: projectId },
          data: { status: "ANALYZING", processedPapers: analyzedCount },
        });
        return;
      }

      const resolved = await resolveAndFetchPdf({
        title: paper.title,
        authors: (paper.authors as { name?: string }[]).map((a) => a.name || "").filter(Boolean),
        year: paper.year ?? 0,
        doi: paper.doi ?? undefined,
        landing_url: candidate.gsUrl || paper.pdfUrl || "",
        source: "google_scholar",
        directPdfUrl: paper.pdfUrl || candidate.pdfUrl || undefined,
        skipFallbackApis,
      });

      if (!resolved || resolved.text.trim().length < 1200) {
        if (skipFallbackApis) {
          // Phase 1 failure: queue for Phase 2 retry with full fallback APIs
          failedDedupeKeys.add(dedupeKey);
          console.log(`[Worker] Phase 1 miss — queued for fallback retry: "${paper.title.slice(0, 60)}"`);
        } else {
          // Phase 2 failure: all methods exhausted — mark as definitively failed
          failedCount++;
          await prisma.projectPaper.update({
            where: { projectId_paperId: { projectId, paperId: paper.id } },
            data: { extractionStatus: "FAILED" },
          });
          await prisma.project.update({ where: { id: projectId }, data: { failedPapers: failedCount } });
        }
        return;
      }

      if (shouldStop(projectId)) return;

      await prisma.project.update({ where: { id: projectId }, data: { status: "ANALYZING" } });

      const analysis: ExtractionResult | null = await analyzePaper(resolved.text, paper.title, false);
      if (!analysis) {
        if (skipFallbackApis) {
          failedDedupeKeys.add(dedupeKey);
        } else {
          failedCount++;
          await prisma.projectPaper.update({
            where: { projectId_paperId: { projectId, paperId: paper.id } },
            data: { extractionStatus: "FAILED" },
          });
          await prisma.project.update({ where: { id: projectId }, data: { failedPapers: failedCount } });
        }
        return;
      }

      let s3Key: string | null = null;
      try {
        const key = `papers/${paper.doi ? slugifyDoi(paper.doi) : slugifyTitle(paper.title)}.pdf`;
        await uploadBuffer(key, resolved.buffer, "application/pdf");
        s3Key = key;
      } catch (error) {
        console.warn("[Worker] R2 upload skipped:", error instanceof Error ? error.message : String(error));
      }

      await prisma.paper.update({
        where: { id: paper.id },
        data: {
          isOpenAccess: true,
          pdfUrl: resolved.pdfUrl,
          s3Key: s3Key ?? paper.s3Key,
          abstract: paper.abstract || resolved.abstractHint || null,
        },
      });

      await prisma.extraction.upsert({
        where: { paperId: paper.id },
        update: {
          methodology: analysis.methodology,
          findings: analysis.findings,
          limitations: analysis.limitations,
          futureWork: analysis.futureWork,
          studyType: analysis.studyType,
          keywords: analysis.keywords,
          rawJson: analysis as object,
          model: "llama-3.3-70b-versatile",
          isAbstractOnly: false,
        },
        create: {
          paperId: paper.id,
          methodology: analysis.methodology,
          findings: analysis.findings,
          limitations: analysis.limitations,
          futureWork: analysis.futureWork,
          studyType: analysis.studyType,
          keywords: analysis.keywords,
          rawJson: analysis as object,
          model: "llama-3.3-70b-versatile",
          isAbstractOnly: false,
        },
      });

      analyzedCount++;
      await prisma.projectPaper.update({
        where: { projectId_paperId: { projectId, paperId: paper.id } },
        data: { extractionStatus: "COMPLETED" },
      });

      await prisma.project.update({
        where: { id: projectId },
        data: { processedPapers: analyzedCount, status: "ANALYZING" },
      });
    }

    try {
      const limit = createLimit(CONCURRENCY);

      // ── Phase 1: OA PDF Downloader + direct GS PDF link only ──────────────────
      // For each candidate, use the article's title_link (gsUrl) with the OA PDF
      // Downloader API (https://oa-pdf-downloader.vercel.app/api/find-pdf) as the
      // primary PDF resolution method. No Unpaywall / OpenAlex / Semantic Scholar
      // calls are made in this phase — keeping credit usage minimal.
      console.log(`[Worker] Phase 1 — OA PDF Downloader only (${ranked.length} candidates, target ${maxPapers})`);
      const phase1Tasks = ranked.map((candidate) =>
        limit(async () => {
          if (analyzedCount >= maxPapers || shouldStop(projectId)) return;
          await processCandidate(candidate, true);
        })
      );
      await Promise.allSettled(phase1Tasks);

      // ── Phase 2: fallback APIs (Unpaywall, OpenAlex, Semantic Scholar, HTML) ──
      // Only runs when Phase 1 did not fulfill the requested paper count.
      if (analyzedCount < maxPapers && !shouldStop(projectId) && failedDedupeKeys.size > 0) {
        console.log(
          `[Worker] Phase 2 — fallback APIs for ${failedDedupeKeys.size} missed papers ` +
          `(${analyzedCount}/${maxPapers} analyzed so far)`
        );
        const limit2 = createLimit(CONCURRENCY);
        const phase2Tasks = ranked.map((candidate) =>
          limit2(async () => {
            if (analyzedCount >= maxPapers || shouldStop(projectId)) return;
            await processCandidate(candidate, false);
          })
        );
        await Promise.allSettled(phase2Tasks);
      } else if (analyzedCount >= maxPapers) {
        console.log(`[Worker] Phase 1 target met (${analyzedCount}/${maxPapers}) — skipping fallback APIs`);
      }

      if (shouldStop(projectId)) {
        await markStopped(projectId);
        return;
      }

      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: "COMPLETED",
          processedPapers: analyzedCount,
          totalPapers: analyzedCount,   // reflect actual successful papers, not requested target
          failedPapers: failedCount,
        },
      });
      console.log(`[Worker] Done — analyzed ${analyzedCount}/${maxPapers}, failed ${failedCount}`);
    } finally {
      clearInterval(stopPollInterval);
      clearStop(projectId);
    }

  } catch (err) {
    console.error(`[Worker] Fatal error for project ${projectId}:`, err);
    await prisma.project.update({ where: { id: projectId }, data: { status: "FAILED", errorMessage: err instanceof Error ? err.message : "Unknown error" } });
    throw err;
  }
}

async function markStopped(projectId: string): Promise<void> {
  clearStop(projectId);
  await prisma.project.update({ where: { id: projectId }, data: { status: "STOPPED" } });
  console.log(`[Worker] Project ${projectId} stopped`);
}
