import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId } = await params;
    const job = await prisma.scriptJob.findFirst({
      where: { id: jobId, userId: session.user.id },
    });

    if (!job) return NextResponse.json({ error: "Job tidak ditemukan." }, { status: 404 });

    return NextResponse.json({ job });
  } catch (error) {
    console.error("[Job GET]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId } = await params;
    const { generatedScript } = await req.json();

    const job = await prisma.scriptJob.findFirst({
      where: { id: jobId, userId: session.user.id },
    });

    if (!job) return NextResponse.json({ error: "Job tidak ditemukan." }, { status: 404 });

    const updated = await prisma.scriptJob.update({
      where: { id: jobId },
      data: { generatedScript },
    });

    return NextResponse.json({ job: updated });
  } catch (error) {
    console.error("[Job PATCH]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
