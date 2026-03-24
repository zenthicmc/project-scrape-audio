import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addScriptJob } from "@/lib/queue";

const CREDITS_PER_GENERATION = parseInt(process.env.CREDITS_PER_GENERATION || "10");

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoUrl, platform, topic, niche, style } = await req.json();

    if (!videoUrl || !platform || !style) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    // Check credits
    const creditBalance = await prisma.creditBalance.findUnique({
      where: { userId: session.user.id },
    });

    if (!creditBalance || creditBalance.balance < CREDITS_PER_GENERATION) {
      return NextResponse.json({ error: "Kredit tidak cukup." }, { status: 402 });
    }

    // Deduct credits and create job in a transaction
    const [, job] = await prisma.$transaction([
      prisma.creditBalance.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: CREDITS_PER_GENERATION } },
      }),
      prisma.scriptJob.create({
        data: {
          userId: session.user.id,
          videoUrl,
          platform,
          topic: topic || null,
          niche: niche || null,
          style,
          status: "PENDING",
          creditsUsed: CREDITS_PER_GENERATION,
        },
      }),
    ]);

    // Record credit transaction
    await prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        amount: -CREDITS_PER_GENERATION,
        type: "USAGE",
        description: `Generate script ${platform} — ${style}`,
        referenceId: job.id,
      },
    });

    // Add to BullMQ queue
    await addScriptJob({
      jobId: job.id,
      userId: session.user.id,
      videoUrl,
      platform,
      topic,
      niche,
      style,
    });

    return NextResponse.json({ jobId: job.id, success: true });
  } catch (error) {
    console.error("[Jobs POST]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.scriptJob.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          platform: true,
          videoUrl: true,
          topic: true,
          niche: true,
          style: true,
          status: true,
          creditsUsed: true,
          createdAt: true,
          completedAt: true,
          errorMessage: true,
        },
      }),
      prisma.scriptJob.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ jobs, total, page, limit });
  } catch (error) {
    console.error("[Jobs GET]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
