import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addScriptJob } from "@/lib/queue";

const CREDITS_PER_GENERATION = parseInt(process.env.CREDITS_PER_GENERATION || "10");

/**
 * POST /api/jobs/[jobId]/retry
 *
 * BUG FIX #2: Manual retry for failed jobs.
 * Creates a brand-new job (new DB record + new queue entry) using the same
 * video URL, platform, topic, niche, and style as the original failed job.
 * Deducts credits normally as per the standard flow.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    // Fetch the original failed job
    const originalJob = await prisma.scriptJob.findUnique({
      where: { id: jobId },
    });

    if (!originalJob) {
      return NextResponse.json({ error: "Job tidak ditemukan." }, { status: 404 });
    }

    // Only allow retry for jobs owned by the current user
    if (originalJob.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow retry if job is in FAILED status
    if (originalJob.status !== "FAILED") {
      return NextResponse.json(
        { error: "Hanya job dengan status FAILED yang bisa di-retry." },
        { status: 400 }
      );
    }

    // Check credits
    const creditBalance = await prisma.creditBalance.findUnique({
      where: { userId: session.user.id },
    });

    if (!creditBalance || creditBalance.balance < CREDITS_PER_GENERATION) {
      return NextResponse.json(
        { error: "Kredit tidak cukup untuk retry." },
        { status: 402 }
      );
    }

    // Deduct credits and create a new job in a transaction
    const [, newJob] = await prisma.$transaction([
      prisma.creditBalance.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: CREDITS_PER_GENERATION } },
      }),
      prisma.scriptJob.create({
        data: {
          userId: session.user.id,
          videoUrl: originalJob.videoUrl,
          platform: originalJob.platform,
          topic: originalJob.topic,
          niche: originalJob.niche,
          targetAudience: originalJob.targetAudience,
          linkedinText: originalJob.linkedinText,
          style: originalJob.style,
          status: "PENDING",
          creditsUsed: CREDITS_PER_GENERATION,
          creditRefunded: false,
        },
      }),
    ]);

    // Record credit transaction
    await prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        amount: -CREDITS_PER_GENERATION,
        type: "USAGE",
        description: `Retry script ${originalJob.platform} — ${originalJob.style}`,
        referenceId: newJob.id,
      },
    });

    // Add new job to BullMQ queue
    await addScriptJob({
      jobId: newJob.id,
      userId: session.user.id,
      videoUrl: originalJob.videoUrl,
      platform: originalJob.platform,
      topic: originalJob.topic ?? undefined,
      niche: originalJob.niche ?? undefined,
      targetAudience: originalJob.targetAudience ?? undefined,
      linkedinText: originalJob.linkedinText ?? undefined,
      style: originalJob.style,
    });

    return NextResponse.json({ jobId: newJob.id, success: true });
  } catch (error) {
    console.error("[Jobs Retry POST]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
