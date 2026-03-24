/**
 * BullMQ Worker Entry Point
 * Run with: node worker.mjs
 * Or in production: NODE_ENV=production node worker.mjs
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load environment variables
const dotenv = await import("dotenv");
dotenv.config({ path: ".env.local" });

// Start the worker
const { startWorker } = await import("./src/lib/worker.ts");
await startWorker();

console.log("[Worker] ScriptAI BullMQ Worker started successfully");
