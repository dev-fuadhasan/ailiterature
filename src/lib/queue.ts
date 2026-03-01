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

let cachedQueue: Queue<ResearchJobData, void, string> | null = null;

export function getResearchQueue(): Queue<ResearchJobData, void, string> | null {
  if (cachedQueue) return cachedQueue;
  if (!process.env.REDIS_URL) return null;

  try {
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

    cachedQueue = new Queue<ResearchJobData, void, string>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    return cachedQueue;
  } catch {
    return null;
  }
}
