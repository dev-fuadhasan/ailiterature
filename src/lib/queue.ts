import { Queue } from "bullmq";

export const QUEUE_NAME = "research-pipeline";

// Job data types
export interface ResearchJobData {
  projectId: string;
  userId: string;
  topic: string;
  yearFrom: number;
  yearTo: number;
  maxPapers: number;
}

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

// The single shared queue — used by Next.js to enqueue jobs
// The worker (Render) consumes from this same queue
export const researchQueue = new Queue<ResearchJobData, void, string>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
