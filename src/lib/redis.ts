import IORedis from "ioredis";

// Upstash Redis requires TLS and specific BullMQ settings
export function createRedisConnection() {
  return new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls:
      process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  });
}

export const redisConnection = createRedisConnection();
