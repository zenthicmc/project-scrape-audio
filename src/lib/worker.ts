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
  const response = await fetch("https://att.awbs.network/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: videoUrl }),
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.transcript || data.text || data.result || "";
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Worker] Job ${jobId} failed:`, errorMessage);

    // Update job as failed
    await prisma.scriptJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage,
      },
    });

    // Refund credits
    await prisma.$transaction([
      prisma.creditBalance.update({
        where: { userId },
        data: { balance: { increment: 10 } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: 10,
          type: "REFUND",
          description: "Refund karena proses gagal",
          referenceId: jobId,
        },
      }),
    ]);

    // Create failure notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Proses Gagal — Kredit Dikembalikan",
        message: `Maaf, proses script gagal: ${errorMessage}. 10 kredit telah dikembalikan ke akun Anda.`,
        type: "JOB_FAILED",
        referenceId: jobId,
        jobId,
      },
    });

    throw error; // Re-throw so BullMQ can handle retries
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
