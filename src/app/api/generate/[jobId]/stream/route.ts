import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// SSE helper
function sseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * GET /api/generate/[jobId]/stream
 *
 * Server-Sent Events (SSE) endpoint that:
 * 1. Polls the DB every 1.5s for job status changes
 * 2. When job is COMPLETED, streams the script content word-by-word for typing effect
 * 3. Sends status events: pending | processing | streaming | completed | failed
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId } = await params;

  // Verify ownership
  const jobCheck = await prisma.scriptJob.findFirst({
    where: { id: jobId, userId: session.user.id },
    select: { id: true },
  });
  if (!jobCheck) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          const msg = sseMessage(event, data);
          console.log(`[SSE Send] event="${event}" dataLength=${JSON.stringify(data).length} jobId=${jobId}`);
          controller.enqueue(encoder.encode(msg));
        } catch (err) {
          console.error(`[SSE Send Error] event="${event}" jobId=${jobId}`, err);
          closed = true;
        }
      };

      // Send initial ping
      send("ping", { ts: Date.now() });

      let lastStatus = "";
      let scriptStreamed = false;
      let pollCount = 0;
      const MAX_POLLS = 200; // ~5 minutes max (200 * 1.5s)

      const poll = async () => {
        if (closed || pollCount >= MAX_POLLS) {
          if (!closed) {
            send("timeout", { message: "Processing timed out" });
            controller.close();
          }
          return;
        }

        pollCount++;

        try {
          const job = await prisma.scriptJob.findUnique({
            where: { id: jobId },
            select: {
              status: true,
              generatedScript: true,
              errorMessage: true,
              transcript: true,
              platform: true,
              style: true,
              topic: true,
              niche: true,
              videoUrl: true,
              createdAt: true,
              completedAt: true,
            },
          });

          if (!job) {
            send("error", { message: "Job not found" });
            controller.close();
            closed = true;
            return;
          }

          // Send status update if changed
          if (job.status !== lastStatus) {
            lastStatus = job.status;
            send("status", {
              status: job.status,
              platform: job.platform,
              style: job.style,
              topic: job.topic,
              videoUrl: job.videoUrl,
            });
          }

          if (job.status === "COMPLETED" && job.generatedScript && !scriptStreamed) {
            scriptStreamed = true;

            // Stream the script word-by-word for typing effect
            const words = job.generatedScript.split(" ");
            const CHUNK_SIZE = 3; // words per chunk
            const DELAY_MS = 40;  // ms between chunks

            send("streaming_start", { totalWords: words.length });

            for (let i = 0; i < words.length; i += CHUNK_SIZE) {
              if (closed) break;
              const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
              const isLast = i + CHUNK_SIZE >= words.length;
              send("chunk", {
                text: isLast ? chunk : chunk + " ",
                index: i,
                total: words.length,
              });
              // Small delay for typing effect
              await new Promise(r => setTimeout(r, DELAY_MS));
            }

            // Send completed event with full script
            send("completed", {
              script: job.generatedScript,
              completedAt: job.completedAt,
            });

            // Wait 500ms to ensure client receives the completed event before closing
            await new Promise(r => setTimeout(r, 500));
            if (!closed) {
              controller.close();
              closed = true;
            }
            return;
          }

          if (job.status === "FAILED") {
            send("failed", {
              error: job.errorMessage || "Processing failed",
            });
            controller.close();
            closed = true;
            return;
          }

          // Still pending/processing — poll again
          setTimeout(poll, 1500);
        } catch (err) {
          console.error("[SSE Stream] Poll error:", err);
          if (!closed) {
            send("error", { message: "Internal server error" });
            controller.close();
            closed = true;
          }
        }
      };

      // Start polling
      poll();
    },

    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
