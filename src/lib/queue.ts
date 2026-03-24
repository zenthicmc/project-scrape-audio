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
    // BUG FIX #1: Set attempts to 1 — no infinite retry
    // If job fails, it stops immediately. Credit refund is handled in worker.
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export interface ScriptJobData {
  jobId: string;
  userId: string;
  videoUrl: string;
  platform: "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "LINKEDIN";
  topic?: string;
  niche?: string;
  targetAudience?: string;   // LinkedIn: target audience
  linkedinText?: string;     // LinkedIn: pasted text (alternative to URL)
  style: string;
}

export async function addScriptJob(data: ScriptJobData) {
  return scriptQueue.add("generate-script", data, {
    jobId: `script-${data.jobId}`,
    // Explicitly override to 1 attempt at the job level as well
    attempts: 1,
  });
}
