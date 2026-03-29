import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queues } from "@/lib/queue";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const [notifications, unreadCount, activeJobsRaw] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
      prisma.scriptJob.findMany({
        where: { userId: session.user.id, status: { in: ['PENDING', 'PROCESSING'] } },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // Deduplicate active jobs: if user clicked 'Regenerate' multiple times, 
    // we only want to show the newest pending/processing job for that exact video/topic.
    const uniqueJobsMap = new Map();
    for (const job of activeJobsRaw) {
      const key = `${job.platform}_${job.videoUrl || job.linkedinText}_${job.style}`;
      if (!uniqueJobsMap.has(key)) {
        uniqueJobsMap.set(key, job);
      }
    }
    const dedupedRawJobs = Array.from(uniqueJobsMap.values()) as typeof activeJobsRaw;

    const activeJobs = await Promise.all(dedupedRawJobs.map(async (job) => {
      const q = queues[job.platform];
      let progress = 0;
      if (q) {
        try {
          const bullJob = await q.getJob(`script-${job.id}`);
          if (bullJob && typeof bullJob.progress === "number") {
            progress = bullJob.progress;
          }
        } catch {
          // Ignore if not found
        }
      }
      return {
        id: job.id,
        platform: job.platform,
        topic: job.topic || "Generate Script",
        status: job.status,
        progress: progress || (job.status === "PROCESSING" ? 15 : 0)
      };
    }));

    return NextResponse.json({ notifications, unreadCount, activeJobs });
  } catch (error) {
    console.error("[Notifications GET]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
