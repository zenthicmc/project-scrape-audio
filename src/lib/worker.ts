import "dotenv/config";
import { Worker, Job } from "bullmq";
import Anthropic from "@anthropic-ai/sdk";
import { ApifyClient } from "apify-client";
import { prisma } from "./prisma";
import { QUEUE_NAMES, ScriptJobData, redisConnection as queueRedisConnection } from "./queue";

const workerConnection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const STYLE_PROMPTS: Record<string, string> = {
  // ── Video script styles (Instagram, TikTok, YouTube Shorts) ──────────────
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
  FOMO_URGENCY:
    "Bangun rasa takut ketinggalan (FOMO) dan urgency. Mulai dengan hook yang membuat audiens merasa mereka akan rugi kalau tidak segera bertindak. Gunakan momentum tren, social proof, dan time pressure. Contoh opening: 'Ini lagi viral banget tapi banyak yang belum tau...', 'Kalau kamu telat lihat ini, kamu rugi...'. Buat audiens merasa harus action sekarang.",
  // ── LinkedIn-specific styles ─────────────────────────────────────────────
  PROFESSIONAL:
    "Tulis dengan tone profesional dan formal. Gunakan bahasa yang bersih, lugas, dan menunjukkan expertise. Hindari slang. Struktur: insight pembuka yang kuat → penjelasan mendalam → takeaway praktis → CTA soft yang mengundang diskusi.",
  THOUGHT_LEADERSHIP:
    "Posisikan penulis sebagai pemimpin pemikiran di bidangnya. Mulai dengan perspektif unik atau kontra-intuitif yang mengejutkan. Bagikan insight mendalam, data, atau pengalaman nyata. Gunakan format LinkedIn yang mudah dibaca (baris pendek, spasi). Akhiri dengan pertanyaan yang mendorong diskusi di komentar.",
  STORYTELLING_LINKEDIN:
    "Gunakan format storytelling khas LinkedIn: mulai dengan momen personal atau pengalaman nyata yang relatable, bangun narasi yang emosional namun profesional, gunakan baris pendek dan spasi untuk readability, akhiri dengan lesson learned yang universal dan CTA untuk engage (like, comment, share).",
};

/**
 * Scrape a LinkedIn post's text content using Apify SDK.
 * Actor: Wpp1BZ6yGWjySadk3 (LinkedIn post scraper)
 * Requires APIFY_API_TOKEN env variable.
 */
async function scrapeLinkedInPost(postUrl: string): Promise<string> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("APIFY_API_TOKEN tidak dikonfigurasi. Hubungi admin untuk mengaktifkan fitur scraping URL LinkedIn.");
  }

  console.log(`[Worker] Scraping LinkedIn post via Apify SDK: ${postUrl}`);

  const client = new ApifyClient({ token: apiToken });

  // Run the actor and wait for it to finish
  const run = await client.actor("Wpp1BZ6yGWjySadk3").call({
    urls: [postUrl],
    limitPerSource: 1,
    deepScrape: true,
    rawData: false,
  });

  console.log(`[Worker] Apify run finished: ${run.id}, status: ${run.status}`);

  if (run.status !== "SUCCEEDED") {
    throw new Error(`Apify actor gagal dengan status: ${run.status}. Pastikan URL LinkedIn valid dan post bersifat publik.`);
  }

  // Fetch results from the run's dataset
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log(`[Worker] Apify LinkedIn scraper returned ${items.length} item(s)`);

  if (!items || items.length === 0) {
    throw new Error("Tidak ada data yang ditemukan dari URL LinkedIn tersebut. Pastikan post bersifat publik dan URL valid.");
  }

  // Extract post text — try common field names
  const item = items[0] as Record<string, unknown>;
  const postText = (item.text || item.content || item.description || item.postText || "") as string;

  if (!postText || postText.trim().length < 10) {
    console.error(`[Worker] Apify item keys: ${Object.keys(item).join(", ")}`);
    console.error(`[Worker] Apify item preview: ${JSON.stringify(item).substring(0, 500)}`);
    throw new Error("Konten post LinkedIn kosong atau terlalu pendek. Pastikan post memiliki teks yang cukup.");
  }

  console.log(`[Worker] LinkedIn post text extracted (${postText.length} chars): ${postText.substring(0, 100)}...`);
  return postText.trim();
}

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
  console.log(`[Worker] Detected SSE response, parsing events...`);

  const lines = rawText.split("\n");
  const transcriptSegments: string[] = [];
  let fullText = "";
  let currentEventType = "";
  let currentData = "";

  for (const line of lines) {
    const trimmedLine = line.trimEnd();

    if (trimmedLine.startsWith("event:")) {
      currentEventType = trimmedLine.slice(6).trim();
      currentData = "";
    } else if (trimmedLine.startsWith("data:")) {
      const dataChunk = trimmedLine.slice(5).trimStart();
      currentData = currentData ? currentData + dataChunk : dataChunk;
    } else if (trimmedLine === "") {
      if (currentData && currentEventType) {
        try {
          const parsed = JSON.parse(currentData);

          if (currentEventType === "done") {
            const ft = (parsed.full_text || "").trim();
            console.log(`[Worker] SSE event="done" full_text length: ${ft.length}, language: ${parsed.language}, segments: ${parsed.total_segments}`);
            if (ft.length > 0) fullText = ft;

          } else if (currentEventType === "transcript") {
            const segText = (parsed.text || "").trim();
            if (segText) {
              transcriptSegments.push(segText);
              if (parsed.index === 1 || parsed.index === parsed.total) {
                console.log(`[Worker] SSE transcript segment ${parsed.index}/${parsed.total}: "${segText.substring(0, 60)}"`);
              }
            }

          } else if (currentEventType === "progress" || currentEventType === "status") {
            console.log(`[Worker] SSE ${currentEventType}: step ${parsed.step}/${parsed.total_steps} (${parsed.progress_pct}%) — ${parsed.stage}: ${parsed.message}`);
          }
        } catch (parseErr) {
          console.warn(`[Worker] SSE event="${currentEventType}" failed to parse JSON data:`, parseErr);
          console.warn(`[Worker] Raw data was: ${currentData.substring(0, 200)}`);
        }
      }

      currentEventType = "";
      currentData = "";
    }
  }

  const accumulated = transcriptSegments.join(" ").trim();
  const transcript = fullText || accumulated;

  console.log(`[Worker] === Transcript extraction summary ===`);
  console.log(`[Worker] Segments collected: ${transcriptSegments.length}`);
  console.log(`[Worker] full_text length (from done): ${fullText.length}`);
  console.log(`[Worker] accumulated length (from segments): ${accumulated.length}`);
  console.log(`[Worker] Using: ${fullText ? "full_text (PRIMARY)" : "accumulated segments (FALLBACK)"}`);

  if (!transcript) {
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

/**
 * Generate script using Claude AI.
 * Supports both video platforms (Instagram, TikTok, YouTube) and LinkedIn text rewriting.
 */
async function generateScript(
  transcript: string,
  style: string,
  platform: string,
  topic?: string,
  niche?: string,
  targetAudience?: string
): Promise<string> {
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.ORIGINAL;
  const isLinkedIn = platform === "LINKEDIN";
  const isYouTube = platform === "YOUTUBE";

  const wordCount = transcript.trim().split(/\s+/).length;
  const minWords = Math.max(50, wordCount - 100);
  const maxWords = wordCount + 200;

  let systemPrompt: string;
  let userContent: string;

  if (isLinkedIn) {
    // LinkedIn-specific prompt: focus on professional rewriting, not video scripting
    const BACKTICK = "`";

    systemPrompt = `Kamu adalah seorang ahli content strategist dan copywriter profesional yang sangat berpengalaman dalam membuat konten LinkedIn yang viral dan engaging.

Tugasmu adalah merewrite dan meningkatkan kualitas konten LinkedIn yang diberikan menjadi versi yang lebih polished, engaging, dan profesional.

⚠️ HANYA OUTPUT HASIL AKHIR SAJA  
DILARANG menyertakan kata pengantar seperti "Berikut hasilnya", penjelasan, atau komentar apa pun.

━━━━━━━━━━━━━━━━━━━━━━━
🎯 INSTRUKSI GAYA
━━━━━━━━━━━━━━━━━━━━━━━

GUNAKAN GAYA BAHASA/PENULISAN: ${stylePrompt}

${targetAudience ? `🎯 TARGET AUDIENS:\n${targetAudience}` : ""}
${topic ? `🧩 TOPIK / KONTEKS:\n${topic}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━
🧠 ATURAN FORMAT LINKEDIN (WAJIB)
━━━━━━━━━━━━━━━━━━━━━━━

1. Gunakan struktur Markdown yang jelas:
   - # untuk judul utama (hook)
   - ## untuk sub-section
   - ### untuk sub-section
   - Bullet list (-) untuk daftar

2. Gunakan EMOJI sebagai visual anchor:
   - Setiap section utama HARUS punya 1 emoji relevan (contoh: ⚙️, 🧠, 🔍, 🚀, 💡)
   - Jangan berlebihan (maksimal 1–2 per section)

3. Gunakan nested structure yang rapi:
   - H1 → H2 → H3 → bullet list
   - Jangan campur semua dalam satu level

4. Gunakan “label mental” untuk setiap section:
   - Contoh: "⚙️ Configuration", "🧠 Insight", "🔍 Problem"
   - Tujuannya agar mudah di-scan dalam 3 detik

5. Format LinkedIn readability:
   - Maksimal 2 kalimat per paragraf
   - Wajib ada whitespace antar section
   - Mobile-first (mudah dibaca cepat)

6. Gunakan inline code (${BACKTICK}) SECARA SELEKTIF untuk istilah teknis:
   - Nama file → ${BACKTICK}model_config.yaml${BACKTICK}
   - Nama folder → ${BACKTICK}src/${BACKTICK}, ${BACKTICK}rag/${BACKTICK}
   - Nama function/class → ${BACKTICK}inference_engine.py${BACKTICK}
   - Istilah teknis spesifik → ${BACKTICK}LLM${BACKTICK}, ${BACKTICK}RAG${BACKTICK}, ${BACKTICK}vector_store${BACKTICK}

7. JANGAN gunakan inline code untuk:
   - Kalimat biasa
   - Kata umum (misal: "system", "data", "process")
   - Seluruh kalimat atau paragraf

8. Maksimal 1–2 inline code per bullet agar tetap clean dan readable

━━━━━━━━━━━━━━━━━━━━━━━
✍️ ATURAN KONTEN
━━━━━━━━━━━━━━━━━━━━━━━

1. Hook HARUS kuat dan dijadikan heading (#)
2. Improve clarity: sederhanakan kalimat kompleks
3. Improve engagement:
   - gunakan pertanyaan retoris
   - boleh tambahkan insight/data jika relevan
4. Pertahankan tone sesuai style ${stylePrompt}
5. Panjang optimal: ${minWords}-${maxWords} kata

━━━━━━━━━━━━━━━━━━━━━━━
🚫 LARANGAN KERAS
━━━━━━━━━━━━━━━━━━━━━━━

- DILARANG menulis:
  - "Hasil Rewrite"
  - kata pengantar atau penutup
  - penjelasan tambahan
- DILARANG menggunakan:
  - garis pemisah (---, ***, ===)
  - karakter seperti — atau --
- JANGAN gunakan label seperti:
  - HOOK:
  - BODY:
  - CTA:

━━━━━━━━━━━━━━━━━━━━━━━
🔥 OUTPUT RULES (PALING PENTING)
━━━━━━━━━━━━━━━━━━━━━━━

- Output HARUS berupa konten final saja
- WAJIB dalam format Markdown rapi
- HARUS menggunakan:
  - Heading (#, ##, ###)
  - Bullet list (-)
  - **bold** untuk penekanan
- Struktur HARUS clean, readable, dan siap publish ke LinkedIn

━━━━━━━━━━━━━━━━━━━━━━━

Berikut adalah konten LinkedIn yang perlu direwrite:

---
${transcript}
---

Buat versi yang lebih baik berdasarkan semua aturan di atas.`;

    userContent = `Berikut adalah konten LinkedIn yang perlu direwrite dan ditingkatkan kualitasnya:\n\n---\n${transcript}\n---\n\nBuat versi yang lebih baik berdasarkan instruksi di atas.`;

  } else {
    // Video script prompt (Instagram, TikTok, YouTube Shorts)
    const platformName = isYouTube ? "YouTube Shorts" : platform === "INSTAGRAM" ? "Instagram Reels" : "TikTok";

    systemPrompt = `Kamu adalah seorang ahli copywriter dan content creator profesional yang sangat berpengalaman dalam membuat script video viral untuk ${platformName}.

Tugasmu adalah memparafrase transkrip video menjadi script yang lebih polished, engaging, dan siap digunakan. HANYA OUTPUT HASIL SCRIPT SAJA TANPA KATA PENGANTAR ATAU PENJELASAN APA PUN.

INSTRUKSI GAYA: ${stylePrompt}

${niche ? `NICHE/INDUSTRI: ${niche}` : ""}
${topic ? `TOPIK/JUDUL: ${topic}` : ""}

ATURAN PENTING:
1. Gunakan bahasa Indonesia yang natural dan conversational
2. Pertahankan informasi dan fakta penting dari transkrip asli
3. Tambahkan hook yang kuat di awal
4. Struktur script mengalir natural: pembuka yang menarik, isi yang informatif, penutup dengan ajakan
5. Gunakan emoji secara strategis untuk meningkatkan engagement
6. Panjang script: 150-400 kata
7. JANGAN gunakan label bagian seperti "HOOK:", "BODY:", "CTA:", atau label struktural lainnya
8. DILARANG KERAS menggunakan garis pemisah markdown (seperti ---, ***, ===) atau karakter transisi (seperti —, --) di mana pun. Pastikan teks bersih dari garis-garis pemisah.
9. SELALU gunakan format Markdown untuk output: gunakan ## untuk heading, **bold** untuk penekanan, - untuk bullet list, dan paragraf terpisah untuk setiap bagian
10. Script harus mengalir natural tanpa penanda struktural yang terlihat oleh pembaca
11. RULES PALING PENTING: DILARANG KERAS menyertakan judul besar tambahan, kata pengantar, atau kalimat penutup. Kembalikan HANYA isi script-nya saja, TETAP GUNAKAN FORMAT MARKDOWN yang rapi.`;

    userContent = `Berikut adalah transkrip video yang perlu diparafrase:\n\n---\n${transcript}\n---\n\nBuat script berdasarkan instruksi di atas.`;
  }

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
    system: systemPrompt,
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");

  let finalScript = content.text;

  // Post-processing cleanup rules
  // 1. Remove markdown horizontal rules (---, ___ , ***) at the start of a line
  finalScript = finalScript.replace(/^[-_*]{3,}\s*$/gm, "");
  // 2. Remove em dashes (—) and en dashes (–), replace with space
  finalScript = finalScript.replace(/[—–]/g, " ");

  return finalScript.trim();
}

/**
 * Safe credit refund — only refund once per job.
 * Uses creditRefunded boolean field to prevent duplicate refunds (credit exploit).
 */
async function safeRefundCredits(jobId: string, userId: string, creditsUsed: number) {
  const updated = await prisma.scriptJob.updateMany({
    where: {
      id: jobId,
      creditRefunded: false,
    },
    data: {
      creditRefunded: true,
    },
  });

  if (updated.count === 0) {
    console.log(`[Worker] Skipping duplicate refund for job ${jobId}`);
    return;
  }

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

function getPlatformLabel(platform: string): string {
  switch (platform) {
    case "INSTAGRAM": return "Instagram";
    case "TIKTOK": return "TikTok";
    case "YOUTUBE": return "YouTube Shorts";
    case "LINKEDIN": return "LinkedIn";
    default: return platform;
  }
}

async function processJob(job: Job<ScriptJobData>) {
  const { jobId, userId, videoUrl, platform, topic, niche, style, targetAudience, linkedinText } = job.data;

  console.log(`[Worker] Processing job ${jobId} for user ${userId}, platform: ${platform}`);

  // Update status to PROCESSING
  await prisma.scriptJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });

  try {
    let transcript: string;

    if (job.data.transcript && job.data.transcript.trim().length > 10) {
      // Reuse existing transcript for regeneration
      await job.updateProgress(20);
      console.log(`[Worker] Regenerating: using existing transcript (${job.data.transcript.length} chars)`);
      transcript = job.data.transcript.trim();

      await prisma.scriptJob.update({
        where: { id: jobId },
        data: { transcript },
      });
    } else if (platform === "LINKEDIN" && linkedinText && linkedinText.trim().length > 10) {
      // LinkedIn with pasted text — skip transcription, use text directly
      console.log(`[Worker] LinkedIn job: using pasted text (${linkedinText.length} chars)`);
      transcript = linkedinText.trim();

      await prisma.scriptJob.update({
        where: { id: jobId },
        data: { transcript },
      });
    } else if (platform === "LINKEDIN" && videoUrl && videoUrl.trim().length > 0) {
      // LinkedIn with URL — scrape post text via Apify
      await job.updateProgress(20);
      console.log(`[Worker] LinkedIn URL mode: scraping post via Apify: ${videoUrl}`);
      transcript = await scrapeLinkedInPost(videoUrl);

      if (!transcript || transcript.trim().length < 10) {
        throw new Error("Konten post LinkedIn kosong. Pastikan URL valid dan post bersifat publik.");
      }

      await prisma.scriptJob.update({
        where: { id: jobId },
        data: { transcript },
      });
    } else {
      // Video platforms (Instagram, TikTok, YouTube)
      await job.updateProgress(20);
      console.log(`[Worker] Transcribing video: ${videoUrl}`);
      transcript = await transcribeVideo(videoUrl);

      if (!transcript || transcript.trim().length < 10) {
        throw new Error("Transkrip kosong atau terlalu pendek. Pastikan video memiliki audio yang jelas.");
      }

      await prisma.scriptJob.update({
        where: { id: jobId },
        data: { transcript },
      });
    }

    // Step 2: Generate script/rewrite with Claude
    await job.updateProgress(60);
    console.log(`[Worker] Generating script with Claude (platform: ${platform}, style: ${style})...`);
    const generatedScript = await generateScript(transcript, style, platform, topic, niche, targetAudience);

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
    const platformLabel = getPlatformLabel(platform);
    const notifTitle = platform === "LINKEDIN"
      ? "Konten LinkedIn Siap! 🎉"
      : "Script Selesai Dibuat! 🎉";
    const notifMessage = platform === "LINKEDIN"
      ? `Konten LinkedIn Anda sudah direwrite dan siap digunakan. Klik untuk melihat hasilnya.`
      : `Script untuk video ${platformLabel} Anda sudah siap. Klik untuk melihat hasilnya.`;

    await prisma.notification.create({
      data: {
        userId,
        title: notifTitle,
        message: notifMessage,
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
        message: `Maaf, proses gagal: ${errorMessage}. ${failedJob?.creditsUsed ?? 10} kredit telah dikembalikan ke akun Anda.`,
        type: "JOB_FAILED",
        referenceId: jobId,
        jobId,
      },
    });

    // Do NOT re-throw — prevents BullMQ from retrying error.
    console.log(`[Worker] Job ${jobId} handled gracefully — no retry will occur`);
  }
}

// ─── Multi-queue worker setup ────────────────────────────────────────────────
// Each platform gets its own Worker instance with high concurrency.
// This ensures LinkedIn (Apify, slow) never blocks Instagram/TikTok/YouTube jobs.
//
// Concurrency per worker:
// - INSTAGRAM / TIKTOK / YOUTUBE: 10 parallel jobs each (fast transcription)
// - LINKEDIN: 5 parallel jobs (slower due to Apify scraping)

const PLATFORM_CONCURRENCY: Record<string, number> = {
  INSTAGRAM: 10,
  TIKTOK: 10,
  YOUTUBE: 10,
  LINKEDIN: 5,
};

export function startWorker() {
  const workers: Worker[] = [];

  for (const [platform, queueName] of Object.entries(QUEUE_NAMES)) {
    const concurrency = PLATFORM_CONCURRENCY[platform] ?? 5;

    const worker = new Worker<ScriptJobData>(queueName, processJob, {
      connection: workerConnection,
      concurrency,
    });

    worker.on("completed", (job) => {
      console.log(`[Worker:${platform}] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker:${platform}] Job ${job?.id} failed:`, err.message);
    });

    worker.on("error", (err) => {
      console.error(`[Worker:${platform}] Worker error:`, err);
    });

    console.log(`[Worker:${platform}] Started — queue: ${queueName}, concurrency: ${concurrency}`);
    workers.push(worker);
  }

  console.log(`[Worker] All ${workers.length} platform workers started`);
  return workers;
}

// Auto-start when run directly (not imported)
if (require.main === module) {
  startWorker();
}
