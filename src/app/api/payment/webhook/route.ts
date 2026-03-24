import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransNotification } from "@/lib/midtrans";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify Midtrans signature
    const { order_id, status_code, gross_amount, signature_key } = body;
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Verify with Midtrans API
    const notification = await verifyMidtransNotification(body);
    const { transaction_status, fraud_status, order_id: orderId } = notification;

    const paymentTx = await prisma.paymentTransaction.findUnique({
      where: { orderId },
      include: { user: true },
    });

    if (!paymentTx) {
      console.error("[Webhook] Payment transaction not found:", orderId);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    let newStatus: "SUCCESS" | "FAILED" | "EXPIRED" | "CANCELLED" | "PENDING" = "PENDING";

    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "accept" || !fraud_status) {
        newStatus = "SUCCESS";
      } else {
        newStatus = "FAILED";
      }
    } else if (transaction_status === "deny" || transaction_status === "cancel") {
      newStatus = "CANCELLED";
    } else if (transaction_status === "expire") {
      newStatus = "EXPIRED";
    } else if (transaction_status === "failure") {
      newStatus = "FAILED";
    }

    // Update payment status
    await prisma.paymentTransaction.update({
      where: { orderId },
      data: {
        status: newStatus,
        paymentMethod: body.payment_type,
        midtransResponse: JSON.stringify(body),
      },
    });

    // If success, add credits to user
    if (newStatus === "SUCCESS" && paymentTx.status !== "SUCCESS") {
      await prisma.$transaction([
        prisma.creditBalance.upsert({
          where: { userId: paymentTx.userId },
          create: { userId: paymentTx.userId, balance: paymentTx.credits },
          update: { balance: { increment: paymentTx.credits } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId: paymentTx.userId,
            amount: paymentTx.credits,
            type: "TOPUP",
            description: `Top up ${paymentTx.credits} credits via Midtrans`,
            referenceId: orderId,
          },
        }),
        prisma.notification.create({
          data: {
            userId: paymentTx.userId,
            title: "Pembayaran Berhasil! 🎉",
            message: `${paymentTx.credits} credits telah ditambahkan ke akun Anda. Selamat berkreasi!`,
            type: "PAYMENT_SUCCESS",
            referenceId: orderId,
          },
        }),
      ]);

      // Notify owner
      try {
        const ownerNotifyUrl = process.env.OWNER_NOTIFY_URL;
        if (ownerNotifyUrl) {
          await fetch(ownerNotifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Pembayaran Baru Diterima",
              content: `User ${paymentTx.user.email} berhasil membeli ${paymentTx.credits} credits seharga Rp ${paymentTx.amount.toString()}`,
            }),
          });
        }
      } catch {}
    }

    if (newStatus === "FAILED" || newStatus === "CANCELLED" || newStatus === "EXPIRED") {
      await prisma.notification.create({
        data: {
          userId: paymentTx.userId,
          title: "Pembayaran Gagal",
          message: `Pembayaran untuk ${paymentTx.credits} credits gagal atau dibatalkan. Silakan coba lagi.`,
          type: "PAYMENT_FAILED",
          referenceId: orderId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
