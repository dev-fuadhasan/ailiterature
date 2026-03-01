import "dotenv/config";
import { Worker } from "bullmq";
import { QUEUE_NAME, ResearchJobData } from "./lib/queue";
import { PDF_RESOLVER_QUEUE } from "./lib/pdf-queue";
import { processResearchData, processResearchJob } from "./processor";
import prisma from "./lib/prisma";
import { resolvePdfUrl } from "./services/pdf-resolver";
import type { PaperInput } from "./services/pdf-resolver";

const redisUrl = new URL(process.env.REDIS_URL!);
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  tls: redisUrl.protocol === "rediss:" ? {} : undefined,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

console.log("🚀 LiteratureAI Worker starting...");
console.log(`   Queue: ${QUEUE_NAME}`);
console.log(`   Redis: ${process.env.REDIS_URL?.split("@")[1] || "connected"}`);

const worker = new Worker<ResearchJobData>(
  QUEUE_NAME,
  async (job) => {
    console.log(`\n[Worker] Job received: ${job.id} | Project: ${job.data.projectId}`);
    await processResearchJob(job);
  },
  {
    connection,
    concurrency: 2, // Process up to 2 projects at the same time
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] ✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] ❌ Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[Worker] Worker error:", err);
});

// ── PDF Resolver worker ───────────────────────────────────────────────────────

const pdfWorker = new Worker<PaperInput>(
  PDF_RESOLVER_QUEUE,
  async (job) => {
    console.log(`\n[PDFWorker] Job ${job.id} | "${job.data.title?.slice(0, 60)}"`);
    const result = await resolvePdfUrl(job.data);
    console.log(`[PDFWorker] Job ${job.id} → ${result.status}`);
    return result;
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 5, duration: 1000 },
  }
);

pdfWorker.on("completed", (job) => {
  console.log(`[PDFWorker] ✅ ${job.id} → ${job.returnvalue?.status}`);
});
pdfWorker.on("failed", (job, err) => {
  console.error(`[PDFWorker] ❌ ${job?.id} failed:`, err.message);
});
pdfWorker.on("error", (err) => {
  console.error("[PDFWorker] error:", err);
});

let fallbackRunning = false;
setInterval(async () => {
  if (fallbackRunning) return;
  fallbackRunning = true;
  try {
    const project = await prisma.project.findFirst({
      where: {
        status: "PENDING",
        stopRequested: false,
        jobId: null,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!project) return;

    console.log(`[Fallback] Processing pending project without queue job: ${project.id}`);
    await processResearchData({
      projectId: project.id,
      userId: project.userId,
      topic: project.topic,
      yearFrom: project.yearFrom,
      yearTo: project.yearTo,
      maxPapers: project.maxPapers,
    });
  } catch (error) {
    console.error("[Fallback] Error:", error instanceof Error ? error.message : String(error));
  } finally {
    fallbackRunning = false;
  }
}, 15000);

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown() {
  console.log("\n[Worker] Shutting down gracefully...");
  await Promise.all([worker.close(), pdfWorker.close()]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("✅ Worker is running and waiting for jobs...\n");
