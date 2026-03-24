import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [creditBalance, transactions] = await Promise.all([
      prisma.creditBalance.findUnique({ where: { userId: session.user.id } }),
      prisma.creditTransaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      balance: creditBalance?.balance ?? 0,
      transactions,
    });
  } catch (error) {
    console.error("[Credits GET]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
