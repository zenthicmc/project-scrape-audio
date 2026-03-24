import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash },
    });

    // Create credit balance with 50 free credits
    await prisma.creditBalance.create({
      data: { userId: user.id, balance: 50 },
    });

    // Create credit transaction for bonus
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 50,
        type: "BONUS",
        description: "Bonus kredit pendaftaran",
      },
    });

    // Create verification token
    const token = nanoid(64);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // Send verification email
    await sendVerificationEmail(email, token, name);

    return NextResponse.json({ success: true, message: "Akun berhasil dibuat. Cek email untuk verifikasi." });
  } catch (error) {
    console.error("[Register]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
