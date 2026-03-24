import "dotenv/config";
import { Worker, Job } from "bullmq";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import { QUEUE_NAME, ScriptJobData } from "./queue";

const workerConnection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const STYLE_PROMPTS: Record<string, string> = {
  ORIGINAL:
    "Pertahankan gaya dan tone asli dari transkrip, hanya perbaiki grammar dan struktur kalimat.",
  MIRIP_REFERENSI:
    "Buat script yang mirip dengan gaya referensi yang diberikan, sesuaikan dengan konteks dan niche.",
  STORY_TELLING:
    "Ubah menjadi narasi berbasis cerita yang engaging. Mulai dengan hook yang kuat, bangun konflik, dan akhiri dengan resolusi yang memuaskan. Gunakan teknik storytelling: setting, karakter, konflik, resolusi.",
  SKEPTICAL_HOOK:
    "Mulai dengan pertanyaan atau pernyataan yang menantang kepercayaan umum. Buat audiens mempertanyakan asumsi mereka, lalu berikan jawaban yang mengejutkan.",
  FOKUS_BENEFIT:
    "Fokus pada manfaat konkret dan hasil nyata. Gunakan angka dan data spesifik. Format: masalah → solusi → manfaat → bukti → CTA.",
  PAS: "Gunakan framework Problem-Agitation-Solution: 1) Identifikasi pain point utama, 2) Agitasi masalah (buat lebih terasa), 3) Presentasikan solusi sebagai jawaban sempurna.",
  FOKUS_FITUR:
    "Highlight fitur-fitur spesifik secara detail. Jelaskan cara kerja, spesifikasi teknis, dan keunggulan kompetitif dari setiap fitur.",
};

async function transcribeVideo(videoUrl: string): Promise<string> {
  console.log(`[Worker] Calling transcription API for: ${videoUrl}`);

  const response = await fetch("https://att.awbs.network/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: videoUrl }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(`[Worker] Transcription API error: ${response.status}`, errorBody.substring(0, 500));
    throw new Error(`Transcription failed (${response.status}): ${errorBody.substring(0, 200)}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  console.log(`[Worker] Transcription response content-type: ${contentType}`);
  console.log(`[Worker] Transcription response length: ${rawText.length}`);
  console.log(`[Worker] Transcription response preview: ${rawText.substring(0, 500)}`);

  // Determine if this is an SSE response by checking both content-type AND body prefix
  const looksLikeSSE = rawText.trimStart().startsWith("event:") || rawText.trimStart().startsWith("data:");

  // Case 1: Standard JSON response (not SSE)
  if (contentType.includes("application/json") && !looksLikeSSE) {
    console.log(`[Worker] Parsing as standard JSON response`);
    try {
      const data = JSON.parse(rawText);
      console.log(`[Worker] JSON parsed OK, keys: [${Object.keys(data).join(", ")}]`);
      return data.transcript || data.text || data.result || "";
    } catch (err) {
      console.error(`[Worker] Failed to parse JSON response:`, err);
      console.error(`[Worker] Full raw response:\n${rawText}`);
      throw new Error(`Failed to parse transcription JSON. Raw (first 300 chars): ${rawText.substring(0, 300)}`);
    }
  }

  // Case 2: SSE response (text/event-stream or body starts with "event:")
  //
  // Confirmed API event format from att.awbs.network/transcribe:
  //
  //   event: progress
  //   data: { step, total_steps, stage, message, progress_pct, request_id }
  //
  //   event: transcript
  //   data: { index, total, text, start, end }   ← one per audio segment
  //
  //   event: done
  //   data: { request_id, language, language_probability, total_segments,
  //           duration, processing_time, full_text }  ← complete transcript
  //
  // STRATEGY:
  //   PRIMARY   → full_text from event "done"  (already assembled by API)
  //   FALLBACK  → join all "text" fields from event "transcript" segments
  //               (in case full_text is missing or empty)

  console.log(`[Worker] Detected SSE response, parsing events...`);

  const lines = rawText.split("\n");
  const transcriptSegments: string[] = [];  // fallback: accumulate per-segment text
  let fullText = "";                         // primary: full_text from event "done"
  let currentEventType = "";
  let currentData = "";

  for (const line of lines) {
    const trimmedLine = line.trimEnd(); // preserve leading spaces in data, trim trailing

    if (trimmedLine.startsWith("event:")) {
      currentEventType = trimmedLine.slice(6).trim();
      currentData = ""; // reset data buffer for new event
    } else if (trimmedLine.startsWith("data:")) {
      // Append to currentData (multi-line data support)
      const dataChunk = trimmedLine.slice(5).trimStart();
      currentData = currentData ? currentData + dataChunk : dataChunk;
    } else if (trimmedLine === "") {
      // Empty line = end of SSE event block — process accumulated data
      if (currentData && currentEventType) {
        try {
          const parsed = JSON.parse(currentData);

          if (currentEventType === "done") {
            // PRIMARY: use full_text from done event
            const ft = (parsed.full_text || "").trim();
            console.log(`[Worker] SSE event="done" full_text length: ${ft.length}, language: ${parsed.language}, segments: ${parsed.total_segments}`);
            if (ft.length > 0) fullText = ft;

          } else if (currentEventType === "transcript") {
            // FALLBACK: accumulate each segment's text
            const segText = (parsed.text || "").trim();
            if (segText) {
              transcriptSegments.push(segText);
              // Log only first and last segment to avoid log spam
              if (parsed.index === 1 || parsed.index === parsed.total) {
                console.log(`[Worker] SSE transcript segment ${parsed.index}/${parsed.total}: "${segText.substring(0, 60)}"`);
              }
            }

          } else if (currentEventType === "progress") {
            // Progress update — just log it
            console.log(`[Worker] SSE progress: step ${parsed.step}/${parsed.total_steps} (${parsed.progress_pct}%) — ${parsed.stage}: ${parsed.message}`);
          }
        } catch (parseErr) {
          console.warn(`[Worker] SSE event="${currentEventType}" failed to parse JSON data:`, parseErr);
          console.warn(`[Worker] Raw data was: ${currentData.substring(0, 200)}`);
        }
      }

      // Reset for next event block
      currentEventType = "";
      currentData = "";
    }
  }

  // Build final transcript:
  //   PRIMARY:  full_text from done event (API-assembled, most reliable)
  //   FALLBACK: join all accumulated segment texts
  const accumulated = transcriptSegments.join(" ").trim();
  const transcript = fullText || accumulated;

  console.log(`[Worker] === Transcript extraction summary ===`);
  console.log(`[Worker] Segments collected: ${transcriptSegments.length}`);
  console.log(`[Worker] full_text length (from done): ${fullText.length}`);
  console.log(`[Worker] accumulated length (from segments): ${accumulated.length}`);
  console.log(`[Worker] Using: ${fullText ? 'full_text (PRIMARY)' : 'accumulated segments (FALLBACK)'}`);

  if (!transcript) {
    // Log full details server-side for debugging, but throw a clean user-facing error
    console.error(`[Worker] Could not extract transcript from response.`);
    console.error(`[Worker] Content-Type: ${contentType}`);
    console.error(`[Worker] Full raw response (first 2000 chars):\n${rawText.substring(0, 2000)}`);
    throw new Error(
      `Gagal mengekstrak transkrip dari video. ` +
      `Pastikan video memiliki audio yang jelas dan URL valid. ` +
      `(segments: ${transcriptSegments.length}, full_text: ${fullText.length} chars)`
    );
  }

  console.log(`[Worker] Extracted transcript (${transcript.length} chars): "${transcript.substring(0, 120)}..."`);
  return transcript;
}

async function generateScript(
  transcript: string,
  style: string,
  topic?: string,
  niche?: string
): Promise<string> {
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.ORIGINAL;

  const systemPrompt = `Kamu adalah seorang ahli copywriter dan content creator profesional yang sangat berpengalaman dalam membuat script video viral untuk Instagram dan TikTok.

Tugasmu adalah memparafrase transkrip video menjadi script yang lebih polished, engaging, dan siap digunakan.

INSTRUKSI GAYA: ${stylePrompt}

${niche ? `NICHE/INDUSTRI: ${niche}` : ""}
${topic ? `TOPIK/JUDUL: ${topic}` : ""}

ATURAN PENTING:
1. Gunakan bahasa Indonesia yang natural dan conversational
2. Pertahankan informasi dan fakta penting dari transkrip asli
3. Tambahkan hook yang kuat di awal
4. Struktur script dengan jelas (hook, body, CTA)
5. Gunakan emoji secara strategis untuk meningkatkan engagement
6. Panjang script: 150-400 kata
7. Format output dengan bagian yang jelas (HOOK, BODY, CTA)`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Berikut adalah transkrip video yang perlu diparafrase:\n\n---\n${transcript}\n---\n\nBuat script berdasarkan instruksi di atas.`,
      },
    ],
    system: systemPrompt,
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");
  return content.text;
}

/**
 * BUG FIX #3: Safe credit refund — only refund once per job.
 * Uses creditRefunded boolean field to prevent duplicate refunds (credit exploit).
 */
async function safeRefundCredits(jobId: string, userId: string, creditsUsed: number) {
  // Atomically check and set creditRefunded to prevent race conditions
  const updated = await prisma.scriptJob.updateMany({
    where: {
      id: jobId,
      creditRefunded: false, // Only update if not yet refunded
    },
    data: {
      creditRefunded: true,
    },
  });

  // If count === 0, refund was already done — skip
  if (updated.count === 0) {
    console.log(`[Worker] Skipping duplicate refund for job ${jobId}`);
    return;
  }

  // Perform the actual credit refund
  await prisma.$transaction([
    prisma.creditBalance.update({
      where: { userId },
      data: { balance: { increment: creditsUsed } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: creditsUsed,
        type: "REFUND",
        description: "Refund karena proses gagal",
        referenceId: jobId,
      },
    }),
  ]);

  console.log(`[Worker] Refunded ${creditsUsed} credits for job ${jobId}`);
}

async function processJob(job: Job<ScriptJobData>) {
  const { jobId, userId, videoUrl, platform, topic, niche, style } = job.data;

  console.log(`[Worker] Processing job ${jobId} for user ${userId}`);

  // Update status to PROCESSING
  await prisma.scriptJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });

  try {
    // Step 1: Transcribe
    await job.updateProgress(20);
    console.log(`[Worker] Transcribing video: ${videoUrl}`);
    const transcript = await transcribeVideo(videoUrl);

    if (!transcript || transcript.trim().length < 10) {
      throw new Error("Transkrip kosong atau terlalu pendek. Pastikan video memiliki audio yang jelas.");
    }

    await prisma.scriptJob.update({
      where: { id: jobId },
      data: { transcript },
    });

    // Step 2: Generate script with Claude
    await job.updateProgress(60);
    console.log(`[Worker] Generating script with Claude...`);
    const generatedScript = await generateScript(transcript, style, topic, niche);

    // Step 3: Update job as completed
    await job.updateProgress(90);
    await prisma.scriptJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        generatedScript,
        completedAt: new Date(),
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Script Selesai Dibuat! 🎉",
        message: `Script untuk video ${platform === "INSTAGRAM" ? "Instagram" : "TikTok"} Anda sudah siap. Klik untuk melihat hasilnya.`,
        type: "JOB_COMPLETED",
        referenceId: jobId,
        jobId,
      },
    });

    await job.updateProgress(100);
    console.log(`[Worker] Job ${jobId} completed successfully`);
  } catch (error) {
    // Sanitize error message: strip any raw SSE/HTTP body content that may have leaked in
    let rawErrorMessage = error instanceof Error ? error.message : "Unknown error";

    // If the error message contains raw SSE text (starts with "event:" or "data:"), replace it
    const looksLikeSSE = rawErrorMessage.includes("event:") || rawErrorMessage.includes("data:") || rawErrorMessage.includes("\\n");
    const errorMessage = looksLikeSSE
      ? "Terjadi kesalahan saat memproses video. Silakan coba lagi atau gunakan URL yang berbeda."
      : rawErrorMessage;

    console.error(`[Worker] Job ${jobId} failed (raw):`, rawErrorMessage);
    console.error(`[Worker] Job ${jobId} failed (sanitized):`, errorMessage);

    // Update job as failed
    await prisma.scriptJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage,
      },
    });

    // Refund credits — only once per job (prevents exploit)
    const failedJob = await prisma.scriptJob.findUnique({ where: { id: jobId } });
    if (failedJob && !failedJob.creditRefunded) {
      await prisma.$transaction([
        prisma.scriptJob.update({
          where: { id: jobId },
          data: { creditRefunded: true },
        }),
        prisma.creditBalance.update({
          where: { userId },
          data: { balance: { increment: failedJob.creditsUsed } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: failedJob.creditsUsed,
            type: "REFUND",
            description: "Refund karena proses gagal",
            referenceId: jobId,
          },
        }),
      ]);
    }

    // Create failure notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Proses Gagal — Kredit Dikembalikan",
        message: `Maaf, proses script gagal: ${errorMessage}. ${failedJob?.creditsUsed ?? 10} kredit telah dikembalikan ke akun Anda.`,
        type: "JOB_FAILED",
        referenceId: jobId,
        jobId,
      },
    });

    // Do NOT re-throw — prevents BullMQ from retrying error.
    // Re-throwing causes BullMQ to mark the job as failed and potentially retry.
    // Since attempts=1, we handle failure gracefully here without re-throwing.
    console.log(`[Worker] Job ${jobId} handled gracefully — no retry will occur`);
  }
}

// Export startWorker for programmatic use
export function startWorker() {
  const worker = new Worker<ScriptJobData>(QUEUE_NAME, processJob, {
    connection: workerConnection,
    concurrency: 3,
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Worker error:", err);
  });

  console.log("[Worker] Script generation worker started");
  return worker;
}

// Auto-start when run directly (not imported)
if (require.main === module) {
  startWorker();
}
