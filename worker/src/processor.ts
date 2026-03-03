import { Job } from "bullmq";
import prisma from "./lib/prisma";
import { uploadBuffer } from "./lib/r2";
import { ResearchJobData } from "./lib/queue";
import { searchGoogleScholar, GoogleScholarPaper, isKnownOAUrl } from "./services/google-scholar";
import { analyzePaper, ExtractionResult, generateTopicVariations } from "./services/groq-analyzer";
import { resolveAndFetchPdf } from "./services/pdf-resolver";
import { shouldStop, markShouldStop, clearStop } from "./lib/stop-signal";

// Increased from 4 to 10 for better throughput (we have 5 Groq API keys rotating)
const CONCURRENCY = 10;

/**
 * Helper to safely update project status, ignoring "Record to update not found" (P2025) errors.
 * This prevents the worker from crashing if the project is deleted mid-processing.
 */
async function safeProjectUpdate(projectId: string, data: any) {
  try {
    await prisma.project.update({ where: { id: projectId }, data });
  } catch (err: any) {
    if (err.code === "P2025") {
      console.warn(`[Worker] Skipped project update for ${projectId} (record not found/deleted).`);
    } else {
      throw err;
    }
  }
}

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
  const jobStartTime = Date.now();
  console.log(`[Worker] Starting project ${projectId}: "${topic}" — target ${maxPapers} fully analyzed PDFs`);

  try {
    await safeProjectUpdate(projectId, { status: "SEARCHING" });

    // Generate 5 topic variations using AI before searching
    console.log(`[Worker] Generating topic variations for: "${topic}"`);
    const topicVariations = await generateTopicVariations(topic);
    console.log(`[Worker] Generated ${topicVariations.length} topic variations:`, topicVariations);

    const searchTarget = Math.min(Math.max(maxPapers * 4, 80), 400);
    const gsPapers = await searchGoogleScholar(topic, yearFrom, yearTo, searchTarget, topicVariations);
    console.log(`[Worker] Retrieved ${gsPapers.length} candidate papers from Google Scholar`);

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
        // Prioritize recent papers: recency weight increased to 40%, relevance 30%, citations 20%, PDF 10%
        const score = recency * 0.40 + relevance * 0.30 + citationSignal * 0.20 + hasPdf * 0.10;
        const quartile = idx / Math.max(gsPapers.length, 1) < 0.25 ? "Q1" : idx / Math.max(gsPapers.length, 1) < 0.5 ? "Q2" : idx / Math.max(gsPapers.length, 1) < 0.75 ? "Q3" : "Q4";
        return { ...paper, score, quartile };
      })
      .sort((a, b) => b.score - a.score);

    // --- Priority Tier Classification for Optimized Download Speed ---------
    // Classify papers into 3 tiers based on download speed patterns:
    // TIER 1 (Fastest): Direct PDF links + ArXiv/PubMed/PMC (instant download)
    // TIER 2 (Fast): Other known OA domains (OA PDF Downloader compatible)
    // TIER 3 (Slow): Unknown domains requiring fallback APIs
    const tier1Ranked: RankedCandidate[] = [];
    const tier2Ranked: RankedCandidate[] = [];
    const tier3Ranked: RankedCandidate[] = [];
    
    const fastDomains = /arxiv\.org|pmc\.ncbi|pubmed\.ncbi|biorxiv\.org|medrxiv\.org/;
    
    for (const paper of ranked) {
      if (paper.pdfUrl || (paper.gsUrl && fastDomains.test(paper.gsUrl))) {
        tier1Ranked.push(paper);
      } else if (isKnownOAUrl(paper.gsUrl)) {
        tier2Ranked.push(paper);
      } else {
        tier3Ranked.push(paper);
      }
    }
    
    // Reassemble: process fastest sources first for maximum throughput
    ranked.splice(0, ranked.length, ...tier1Ranked, ...tier2Ranked, ...tier3Ranked);
    console.log(`[Worker] Download priority tiers: T1=${tier1Ranked.length} (instant), T2=${tier2Ranked.length} (fast OA), T3=${tier3Ranked.length} (slow)`);

    await safeProjectUpdate(projectId, { status: "DOWNLOADING", totalPapers: maxPapers });

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
        // Phase 2: process Phase 1 failures AND any candidate not yet attempted.
        // Papers that succeeded in Phase 1 (in `seen` but NOT in `failedDedupeKeys`) are skipped.
        const wasPhase1Failure = failedDedupeKeys.has(dedupeKey);
        const neverAttempted   = !seen.has(dedupeKey);
        if (!wasPhase1Failure && !neverAttempted) return; // skip Phase 1 successes
        if (wasPhase1Failure) failedDedupeKeys.delete(dedupeKey);
        if (neverAttempted)   seen.add(dedupeKey);
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
        await safeProjectUpdate(projectId, {
          status: "ANALYZING", processedPapers: analyzedCount
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

      let textToAnalyze: string | null = null;
      let isAbstractOnly = false;
      let pdfBuffer: Buffer | null = null;
      let pdfUrlResult: string | null = null;
      let abstractHint: string | null = null;

      if (resolved && resolved.kind === "pdf") {
        if (resolved.data.text.trim().length >= 1000) {
          textToAnalyze = resolved.data.text;
          isAbstractOnly = false;
          pdfBuffer = resolved.data.buffer;
          pdfUrlResult = resolved.data.pdfUrl;
          abstractHint = resolved.data.abstractHint;
        }
      } else if (resolved && resolved.kind === "abstract-only") {
        // If we found a good abstract, use it!
        textToAnalyze = resolved.text;
        isAbstractOnly = true;
        // Keep pdfUrlResult null or use landing page? Let's keep existing logic which might rely on null for "no PDF".
        // Actually, we can store the landing page URL as the "source" link.
      }

      if (!textToAnalyze) {
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
          await safeProjectUpdate(projectId, { failedPapers: failedCount });
        }
        return;
      }

      if (shouldStop(projectId)) return;

      await safeProjectUpdate(projectId, { status: "ANALYZING" });

      const analysis: ExtractionResult | null = await analyzePaper(textToAnalyze, paper.title, isAbstractOnly);
      
      // If full-text analysis failed but we ignored abstract fallbacks previously, maybe we should've tried?
      // But analyzePaper handles retries.
      
      if (!analysis) {
        if (skipFallbackApis) {
          failedDedupeKeys.add(dedupeKey);
        } else {
          failedCount++;
          await prisma.projectPaper.update({
            where: { projectId_paperId: { projectId, paperId: paper.id } },
            data: { extractionStatus: "FAILED" },
          });
          await safeProjectUpdate(projectId, { failedPapers: failedCount });
        }
        return;
      }

      let s3Key: string | null = null;
      if (pdfBuffer) {
        try {
          const key = `papers/${paper.doi ? slugifyDoi(paper.doi) : slugifyTitle(paper.title)}.pdf`;
          await uploadBuffer(key, pdfBuffer, "application/pdf");
          s3Key = key;
        } catch (error) {
          console.warn("[Worker] R2 upload skipped:", error instanceof Error ? error.message : String(error));
        }
      }

      await prisma.paper.update({
        where: { id: paper.id },
        data: {
          isOpenAccess: !!pdfUrlResult,
          pdfUrl: pdfUrlResult ?? paper.pdfUrl, // Keep existing if null
          s3Key: s3Key ?? paper.s3Key,
          abstract: isAbstractOnly ? (textToAnalyze || paper.abstract) : (paper.abstract || abstractHint || null),
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
          isAbstractOnly: isAbstractOnly,
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
          isAbstractOnly: isAbstractOnly,
        },
      });

      analyzedCount++;
      await prisma.projectPaper.update({
        where: { projectId_paperId: { projectId, paperId: paper.id } },
        data: { extractionStatus: "COMPLETED" },
      });

      await safeProjectUpdate(projectId, { processedPapers: analyzedCount, status: "ANALYZING" });
    }

    try {
      const phase1StartTime = Date.now();
      
      // ── Phase 1: OA PDF Downloader + direct GS PDF link only ──────────────────
      // PERFORMANCE OPTIMIZED: Process papers in PARALLEL batches of 10 instead of
      // sequential one-by-one. With 5 Groq API keys rotating, we can handle 10
      // concurrent analyses without rate limits. 3-5x faster than sequential.
      console.log(`[Worker] Phase 1 — Processing papers in parallel batches (target ${maxPapers}, concurrency ${CONCURRENCY})`);
      
      const phase1Limit = createLimit(CONCURRENCY);
      const phase1Promises: Promise<void>[] = [];
      
      for (const candidate of ranked) {
        if (analyzedCount >= maxPapers || shouldStop(projectId)) break;
        phase1Promises.push(phase1Limit(() => processCandidate(candidate, true)));
      }
      
      await Promise.all(phase1Promises);
      
      const phase1Duration = ((Date.now() - phase1StartTime) / 1000).toFixed(1);
      console.log(`[Worker] Phase 1 completed in ${phase1Duration}s — analyzed ${analyzedCount}/${maxPapers}`);


      // ── Phase 2: fallback APIs (Unpaywall, OpenAlex, Semantic Scholar, HTML) ──
      // Runs whenever Phase 1 did not fulfill the requested paper count.
      // Retries Phase 1 failures AND processes high-priority fresh candidates in PARALLEL.
      if (analyzedCount < maxPapers && !shouldStop(projectId)) {
        const phase2StartTime = Date.now();
        const deficit = maxPapers - analyzedCount;
        // Smart limit: try up to 3x the deficit to avoid processing hundreds of slow fallback candidates
        const maxPhase2Attempts = Math.min(deficit * 3, 60);
        
        console.log(
          `[Worker] Phase 2 — ${failedDedupeKeys.size} failures + fresh candidates ` +
          `(need ${deficit} more, will try up to ${maxPhase2Attempts} candidates in parallel)`
        );
        
        const phase2Limit = createLimit(CONCURRENCY);
        const phase2Promises: Promise<void>[] = [];
        let attempted = 0;
        
        for (const candidate of ranked) {
          if (analyzedCount >= maxPapers || shouldStop(projectId) || attempted >= maxPhase2Attempts) break;
          attempted++;
          phase2Promises.push(phase2Limit(() => processCandidate(candidate, false)));
        }
        
        await Promise.all(phase2Promises);
        
        const phase2Duration = ((Date.now() - phase2StartTime) / 1000).toFixed(1);
        console.log(`[Worker] Phase 2 completed in ${phase2Duration}s — total analyzed ${analyzedCount}/${maxPapers}`);
      } else if (analyzedCount >= maxPapers) {
        console.log(`[Worker] Phase 1 target met (${analyzedCount}/${maxPapers}) — skipping fallback APIs`);
      }

      if (shouldStop(projectId)) {
        await markStopped(projectId);
        return;
      }

      await safeProjectUpdate(projectId, {
        status: "COMPLETED",
        processedPapers: analyzedCount,
        totalPapers: analyzedCount,   // reflect actual successful papers, not requested target
        failedPapers: failedCount,
      });
      
      const totalDuration = ((Date.now() - jobStartTime) / 1000).toFixed(1);
      const papersPerMinute = (analyzedCount / (parseFloat(totalDuration) / 60)).toFixed(1);
      console.log(
        `[Worker] ✓ COMPLETED — ${analyzedCount}/${maxPapers} papers analyzed, ` +
        `${failedCount} failed | Total time: ${totalDuration}s | ` +
        `Throughput: ${papersPerMinute} papers/min`
      );
    } finally {
      clearInterval(stopPollInterval);
      clearStop(projectId);
    }

  } catch (err) {
    console.error(`[Worker] Fatal error for project ${projectId}:`, err);
    await safeProjectUpdate(projectId, { status: "FAILED", errorMessage: err instanceof Error ? err.message : "Unknown error" });
    throw err;
  }
}

async function markStopped(projectId: string): Promise<void> {
  clearStop(projectId);
  await safeProjectUpdate(projectId, { status: "STOPPED" });
  console.log(`[Worker] Project ${projectId} stopped`);
}
