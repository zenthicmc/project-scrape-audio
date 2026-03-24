import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSnapTransaction } from "@/lib/midtrans";
import { CREDIT_PACKAGES } from "@/lib/utils";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { packageId } = await req.json();
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: "Paket tidak valid." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

    const orderId = `SCRIPTAI-${nanoid(12).toUpperCase()}`;

    // Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        userId: session.user.id,
        orderId,
        amount: BigInt(pkg.price),
        credits: pkg.credits,
        status: "PENDING",
      },
    });

    // Create Midtrans Snap transaction
    const transaction = await createSnapTransaction({
      orderId,
      amount: pkg.price,
      credits: pkg.credits,
      customerName: user.name || "User",
      customerEmail: user.email,
    });

    // Save snap token
    await prisma.paymentTransaction.update({
      where: { orderId },
      data: { snapToken: transaction.token },
    });

    return NextResponse.json({ snapToken: transaction.token, orderId });
  } catch (error) {
    console.error("[Payment Create]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
