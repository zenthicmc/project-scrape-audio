import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisConnection = {
  url: REDIS_URL,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

// ─── Queue names per platform ─────────────────────────────────────────────────
// Each platform gets its own dedicated queue so they never block each other.
// - INSTAGRAM / TIKTOK / YOUTUBE: video transcription → Claude
// - LINKEDIN: Apify scraping (slower) or paste text → Claude
export const QUEUE_NAMES = {
  INSTAGRAM: "script-instagram",
  TIKTOK: "script-tiktok",
  YOUTUBE: "script-youtube",
  LINKEDIN: "script-linkedin",
} as const;

export type Platform = keyof typeof QUEUE_NAMES;

// Default job options shared across all queues
const DEFAULT_JOB_OPTIONS = {
  attempts: 1,           // No automatic retry — credit refund is handled in worker
  removeOnComplete: 100,
  removeOnFail: 200,
};

// ─── Queue instances (one per platform) ──────────────────────────────────────
export const queues: Record<Platform, Queue> = {
  INSTAGRAM: new Queue(QUEUE_NAMES.INSTAGRAM, {
    connection: redisConnection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  }),
  TIKTOK: new Queue(QUEUE_NAMES.TIKTOK, {
    connection: redisConnection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  }),
  YOUTUBE: new Queue(QUEUE_NAMES.YOUTUBE, {
    connection: redisConnection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  }),
  LINKEDIN: new Queue(QUEUE_NAMES.LINKEDIN, {
    connection: redisConnection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  }),
};

// ─── Job data type ────────────────────────────────────────────────────────────
export interface ScriptJobData {
  jobId: string;
  userId: string;
  videoUrl: string;
  platform: Platform;
  topic?: string;
  niche?: string;
  targetAudience?: string;   // LinkedIn: target audience
  linkedinText?: string;     // LinkedIn: pasted text (alternative to URL)
  style: string;
}

// ─── Add job to the correct platform queue ────────────────────────────────────
export async function addScriptJob(data: ScriptJobData) {
  const queue = queues[data.platform];
  if (!queue) {
    throw new Error(`Unknown platform: ${data.platform}`);
  }
  return queue.add("generate-script", data, {
    jobId: `script-${data.jobId}`,
    attempts: 1,
  });
}

// ─── Legacy exports (kept for backward compatibility) ─────────────────────────
export const QUEUE_NAME = QUEUE_NAMES.INSTAGRAM;
export const scriptQueue = queues.INSTAGRAM;
