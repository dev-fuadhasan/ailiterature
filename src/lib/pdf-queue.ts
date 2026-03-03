import { Queue } from "bullmq";
import type { PaperInput, ResolveOutput } from "@/types/pdf-resolver";

export const PDF_RESOLVER_QUEUE = "pdf-resolver";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not configured. Set REDIS_URL in your web runtime environment.");
}

const redisUrl = new URL(process.env.REDIS_URL);

const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  tls: redisUrl.protocol === "rediss:" ? {} : undefined,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
  connectTimeout: 8000,
};

/** BullMQ queue for PDF resolution jobs — Next.js enqueues, Railway worker processes. */
export const pdfResolverQueue = new Queue<PaperInput, ResolveOutput>(
  PDF_RESOLVER_QUEUE,
  {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: { count: 100, age: 60 * 60 * 24 }, // 1 day max, 100 jobs
      removeOnFail: { count: 50 },
    },
  }
);
