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
    "Preserve the original style and tone of the transcript. Only fix grammar and sentence structure.",
  MIRIP_REFERENSI:
    "Write a script that closely mirrors the style of the given reference. Adapt it to the content's context and niche.",
  STORY_TELLING:
    "Transform the content into an engaging story-driven narrative. Open with a strong hook, build tension or conflict, and close with a satisfying resolution. Use core storytelling elements: setting, character, conflict, resolution.",
  SKEPTICAL_HOOK:
    "Open with a question or statement that challenges a common belief. Make the audience question their assumptions, then deliver a surprising or counter-intuitive answer.",
  FOKUS_BENEFIT:
    "Focus on concrete benefits and tangible results. Use specific numbers and data. Follow this format: problem → solution → benefit → proof → CTA.",
  PAS:
    "Apply the Problem-Agitation-Solution framework: 1) Identify the core pain point, 2) Agitate the problem to make it feel more urgent and real, 3) Present the solution as the perfect answer.",
  FOKUS_FITUR:
    "Highlight specific features in detail. Explain how each one works, its technical specs, and its competitive advantages.",
  FOMO_URGENCY:
    "Build a strong sense of FOMO (fear of missing out) and urgency. Open with a hook that makes the audience feel they will lose out if they don't act immediately. Leverage trending momentum, social proof, and time pressure. Example openings: 'This is going viral but most people still don't know...', 'If you're seeing this late, you're already missing out...'. Make the audience feel compelled to act right now.",
  // ── LinkedIn-specific styles ─────────────────────────────────────────────
  PROFESSIONAL:
    "Write with a professional and formal tone. Use clean, direct language that demonstrates expertise. Avoid slang. Structure: strong opening insight → in-depth explanation → practical takeaway → soft CTA that invites discussion.",
  THOUGHT_LEADERSHIP:
    "Position the author as a thought leader in their field. Open with a unique or counter-intuitive perspective that surprises the reader. Share deep insights, data, or real experiences. Use LinkedIn-friendly formatting (short lines, spacing). Close with a question that sparks discussion in the comments.",
  STORYTELLING_LINKEDIN:
    "Use LinkedIn's signature storytelling format: open with a relatable personal moment or real experience, build an emotionally resonant yet professional narrative, use short lines and whitespace for readability, and close with a universal lesson learned plus a CTA to engage (like, comment, share).",
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
    // ── LinkedIn prompt ────────────────────────────────────────────────────
    const BACKTICK = "`";

    systemPrompt = `You are an expert content strategist and professional copywriter with deep experience crafting viral, engaging LinkedIn content.

Your task is to rewrite and elevate the quality of the given LinkedIn content into a more polished, engaging, and professional version.

⚠️ OUTPUT THE FINAL CONTENT ONLY.
Do NOT include any preamble such as "Here is the result", explanations, or commentary of any kind.

━━━━━━━━━━━━━━━━━━━━━━━
🌐 LANGUAGE DETECTION & SPELLING CORRECTION (MANDATORY — DO THIS FIRST)
━━━━━━━━━━━━━━━━━━━━━━━

1. AUTO-DETECT LANGUAGE:
   - Identify the dominant language of the given content
   - If the content is predominantly Indonesian → use Indonesian throughout the entire output
   - If the content is predominantly English → use English throughout the entire output
   - NEVER switch or mix languages from the original content

2. FIX TYPOS & SPELLING ERRORS:
   - Correct all obvious typos and misspellings
   - For technical terms, product names, brand names, people's names, or acronyms that look wrong or unusual:
     - Fix them to the correct standard spelling based on your knowledge
     - Examples: "Chat GPT" → "ChatGPT", "youtueb" → "YouTube", "tik tok" → "TikTok"
     - Examples: "artifisial intelijens" → "artificial intelligence", "machine learnig" → "machine learning"
   - Also fix common word-splitting errors
   - PRESERVE the original meaning and context — do not alter facts or data

━━━━━━━━━━━━━━━━━━━━━━━
🎯 STYLE INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━

APPLY THIS WRITING STYLE: ${stylePrompt}

${targetAudience ? `🎯 TARGET AUDIENCE:\n${targetAudience}` : ""}
${topic ? `🧩 TOPIC / CONTEXT:\n${topic}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━
🧠 LINKEDIN FORMAT RULES (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━

1. Use clear Markdown structure:
   - # for the main title (hook)
   - ## for sub-sections
   - ### for deeper sub-sections
   - Bullet list (-) for lists of points

2. Use EMOJI as visual anchors:
   - Every major section MUST have 1 relevant emoji (e.g. ⚙️, 🧠, 🔍, 🚀, 💡)
   - Do not overdo it (max 1–2 per section)

3. Use clean nested structure:
   - H1 → H2 → H3 → bullet list
   - Do not flatten everything to the same level

4. Use "mental labels" for each section:
   - Examples: "⚙️ Configuration", "🧠 Insight", "🔍 Problem"
   - Purpose: scannable within 3 seconds

5. LinkedIn readability format:
   - Max 2 sentences per paragraph
   - Mandatory whitespace between sections
   - Mobile-first (fast to skim)

6. Use inline code (${BACKTICK}) SELECTIVELY for technical terms:
   - Filenames → ${BACKTICK}model_config.yaml${BACKTICK}
   - Folders → ${BACKTICK}src/${BACKTICK}, ${BACKTICK}rag/${BACKTICK}
   - Functions/classes → ${BACKTICK}inference_engine.py${BACKTICK}
   - Specific technical terms → ${BACKTICK}LLM${BACKTICK}, ${BACKTICK}RAG${BACKTICK}, ${BACKTICK}vector_store${BACKTICK}

7. DO NOT use inline code for:
   - Regular sentences
   - Generic words (e.g. "system", "data", "process")
   - Entire sentences or paragraphs

8. Max 1–2 inline code instances per bullet to keep it clean and readable

━━━━━━━━━━━━━━━━━━━━━━━
✍️ CONTENT RULES
━━━━━━━━━━━━━━━━━━━━━━━

1. The hook MUST be strong and used as the main heading (#)
2. Improve clarity: simplify complex sentences
3. Improve engagement:
   - use rhetorical questions
   - add relevant insights or data where appropriate
4. Maintain the tone consistent with the requested style
5. Optimal length: ${minWords}–${maxWords} words

━━━━━━━━━━━━━━━━━━━━━━━
🚫 HARD PROHIBITIONS
━━━━━━━━━━━━━━━━━━━━━━━

- NEVER write:
  - "Rewrite Result" or any similar preamble
  - additional explanations or commentary
- NEVER use:
  - horizontal dividers (---, ***, ===)
  - characters like — or --
- DO NOT use structural labels such as:
  - HOOK:, BODY:, CTA:

━━━━━━━━━━━━━━━━━━━━━━━
🔥 OUTPUT RULES (MOST IMPORTANT)
━━━━━━━━━━━━━━━━━━━━━━━

- Output MUST be the final content only
- MUST use clean Markdown formatting
- MUST include:
  - Headings (#, ##, ###)
  - Bullet lists (-)
  - **bold** for emphasis
- Output language MUST match the dominant language of the original content
- Structure MUST be clean, readable, and ready to publish on LinkedIn`;

    userContent = `Here is the LinkedIn content that needs to be rewritten and improved:\n\n---\n${transcript}\n---\n\nStep 1: Detect the dominant language and fix all typos/spelling errors. Then produce a better version following all the instructions above.`;

  } else {
    // ── Video Script prompt (Instagram Reels, TikTok, YouTube Shorts) ─────
    const platformName = isYouTube ? "YouTube Shorts" : platform === "INSTAGRAM" ? "Instagram Reels" : "TikTok";

    systemPrompt = `You are an expert copywriter and professional content creator with deep experience producing viral video scripts for ${platformName}.

Your task is to rephrase the given video transcript into a more polished, engaging script that is ready to be delivered on camera.

⚠️ OUTPUT THE FINAL SCRIPT ONLY — NO PREAMBLE, EXPLANATIONS, OR COMMENTARY OF ANY KIND.

━━━━━━━━━━━━━━━━━━━━━━━
🚨 CONTENT BOUNDARIES — READ THIS FIRST
━━━━━━━━━━━━━━━━━━━━━━━

The transcript is your PRIMARY source. You may enhance the delivery, but you must NEVER leave its topic.

✅ ALLOWED — enhancements that stay within the topic:
- Rephrase and polish existing sentences for better clarity and flow
- Reorder content for a stronger narrative structure
- Strengthen the hook by amplifying what is already said in the transcript
- Add a short CTA (e.g. "follow for more", "comment below", "save this") that is naturally relevant to the topic being discussed
- Add transitional phrases between existing points to improve flow
- Carefully expand or clarify points that are already implied in the transcript, as long as they remain fully aligned with the original context and do not introduce new directions

⚠️ ALLOWED WITH WARNING — use with extreme caution:
- Adding supporting details is permitted ONLY if they are directly implied and do not introduce new meaning
- Light examples or analogies may be used ONLY if they strictly mirror the speaker's intent and do not expand the topic scope
- Minor assumptions can be made ONLY to improve clarity, not to add new information
- You may fill small gaps ONLY if the context is obvious and stays faithful to the original message
- Any expansion must NOT shift, distort, or extend the original intent of the speaker
- Do NOT introduce new sub-topics, perspectives, or external references under any circumstance

━━━━━━━━━━━━━━━━━━━━━━━
🌐 LANGUAGE DETECTION & SPELLING CORRECTION (MANDATORY — DO THIS FIRST)
━━━━━━━━━━━━━━━━━━━━━━━

1. AUTO-DETECT LANGUAGE:
   - Identify the dominant language of the given transcript
   - If the transcript is predominantly Indonesian → use Indonesian throughout the entire script output
   - If the transcript is predominantly English → use English throughout the entire script output
   - NEVER switch or mix languages from the original transcript

2. FIX TYPOS & SPELLING ERRORS FROM AUDIO-TO-TEXT TRANSCRIPTION:
   - Speech-to-text models frequently produce errors — fix all of them
   - For technical terms, product names, brand names, people's names, and acronyms:
     - Correct to the proper standard spelling based on context and your knowledge
     - Examples: "Chat GPT" → "ChatGPT", "youtueb" → "YouTube", "tik tok" → "TikTok"
     - Examples: "artifisial intelijens" → "artificial intelligence", "machine learnig" → "machine learning"
   - Fix words misrecognized due to phonetic similarity (homophones/near-homophones):
     - Examples: "karna" → "karena", detached prefix "di" → "di-"
   - PRESERVE the original meaning and facts — do not alter numbers, data, or claims

━━━━━━━━━━━━━━━━━━━━━━━
🎯 STYLE INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━

APPLY THIS WRITING STYLE: ${stylePrompt}

${niche ? `🏷️ NICHE / INDUSTRY: ${niche}` : ""}
${topic ? `🧩 TOPIC / TITLE: ${topic}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━
📋 SCRIPT STRUCTURE RULES (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━

1. Opening (HOOK):
   - Rephrase or amplify the most attention-grabbing moment from the transcript as the opening
   - You may reframe it as a question or bold statement — but it must be rooted in what the transcript actually says
   - Make it a standalone paragraph

2. Flowing content structure:
   - Use ## to mark major sections of the script
   - Use **bold** for key terms or important emphasis
   - Use bullet lists (-) for sequentially mentioned points
   - Separate each section with a blank line for readability

3. Sentence length and rhythm:
   - Short, punchy sentences for the opening and closing
   - Slightly longer sentences are fine for explanatory sections
   - Max 2–3 sentences per paragraph

4. Emoji usage:
   - Add 1 relevant emoji at the start of each major section as a visual anchor
   - Use contextually relevant emojis (🔥, 💡, ⚠️, ✅, 🎯, etc.)
   - Max 1–2 emojis per paragraph — do not overdo it

5. Closing (CTA):
   - End with a short, natural CTA relevant to the topic (e.g. "follow for more", "drop your thoughts below", "save this for later")
   - The CTA must feel like a natural extension of the topic — not a generic unrelated filler

━━━━━━━━━━━━━━━━━━━━━━━
✍️ CONTENT RULES
━━━━━━━━━━━━━━━━━━━━━━━

1. Use conversational, natural language — the way people actually speak, not formal writing
2. Preserve ALL facts, data, and key points from the original transcript — do not drop or distort them
3. Improve clarity: simplify rambling or overly complex sentences
4. Tone MUST match the requested style (not stiff or overly formal)
5. Script length should be proportional to the transcript — do NOT pad it artificially

━━━━━━━━━━━━━━━━━━━━━━━
🚫 HARD PROHIBITIONS
━━━━━━━━━━━━━━━━━━━━━━━

- NEVER invent facts, statistics, stories, or claims not present in the transcript
- NEVER introduce topics or angles the speaker did not discuss
- NEVER include preamble text: "Here is the script", "This is the result", etc.
- NEVER use rigid structural labels: HOOK:, BODY:, CTA:, INTRO:, OUTRO:
- NEVER use horizontal dividers: ---, ***, ===
- NEVER use em/en dash characters: —, –
- NEVER write a meta-comment or closing remark after the script ends

━━━━━━━━━━━━━━━━━━━━━━━
🔥 OUTPUT RULES (MOST IMPORTANT)
━━━━━━━━━━━━━━━━━━━━━━━

- Output MUST be the final script content only
- MUST use clean Markdown formatting:
  - ## for section headings
  - **bold** for emphasis
  - - for bullet lists
  - Separate paragraphs per section
- Output language MUST match the dominant language of the original transcript
- The script must be ready to read aloud without any further editing`;

    userContent = `Here is the video transcript to rephrase into a ${platformName} script:\n\n---\n${transcript}\n---\n\nStep 1: Detect the dominant language and fix all typos/spelling errors from the audio-to-text transcription. Then produce the script following all the instructions above.`;
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