import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const body = await req.json();

    if (typeof body.generatedScript !== "string") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const job = await prisma.scriptJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.scriptJob.update({
      where: { id: jobId },
      data: {
        generatedScript: body.generatedScript,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Job PATCH Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
