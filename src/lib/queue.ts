import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Use URL-based connection to avoid ioredis version conflicts
export const redisConnection = {
  url: REDIS_URL,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

export const QUEUE_NAME = "script-generation";

export const scriptQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export interface ScriptJobData {
  jobId: string;
  userId: string;
  videoUrl: string;
  platform: "INSTAGRAM" | "TIKTOK";
  topic?: string;
  niche?: string;
  style: string;
}

export async function addScriptJob(data: ScriptJobData) {
  return scriptQueue.add("generate-script", data, {
    jobId: `script-${data.jobId}`,
  });
}
