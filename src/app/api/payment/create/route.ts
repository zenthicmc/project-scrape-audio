import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSnapTransaction } from "@/lib/midtrans";
import { MIN_TOPUP_AMOUNT, MAX_TOPUP_AMOUNT } from "@/lib/utils";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const amount = parseInt(body.amount);
    const credits = parseInt(body.credits);

    // Validate amount
    if (!amount || isNaN(amount) || amount < MIN_TOPUP_AMOUNT) {
      return NextResponse.json(
        { error: `Minimal top-up adalah Rp ${MIN_TOPUP_AMOUNT.toLocaleString("id-ID")}.` },
        { status: 400 }
      );
    }
    if (amount > MAX_TOPUP_AMOUNT) {
      return NextResponse.json(
        { error: `Maksimal top-up adalah Rp ${MAX_TOPUP_AMOUNT.toLocaleString("id-ID")}.` },
        { status: 400 }
      );
    }
    if (!credits || isNaN(credits) || credits <= 0) {
      return NextResponse.json({ error: "Jumlah credit tidak valid." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

    const orderId = `SCRIPTAI-${nanoid(12).toUpperCase()}`;

    // Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        userId: session.user.id,
        orderId,
        amount: BigInt(amount),
        credits,
        status: "PENDING",
      },
    });

    // Create Midtrans Snap transaction
    const transaction = await createSnapTransaction({
      orderId,
      amount,
      credits,
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
