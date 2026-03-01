import { Queue } from "bullmq";
import type { PaperInput, ResolveOutput } from "@/types/pdf-resolver";

export const PDF_RESOLVER_QUEUE = "pdf-resolver";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");

const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  tls: redisUrl.protocol === "rediss:" ? {} : undefined,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

/** BullMQ queue for PDF resolution jobs — Next.js enqueues, Railway worker processes. */
export const pdfResolverQueue = new Queue<PaperInput, ResolveOutput>(
  PDF_RESOLVER_QUEUE,
  {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: { count: 500, age: 60 * 60 * 24 * 7 }, // 7 days
      removeOnFail: { count: 100 },
    },
  }
);
