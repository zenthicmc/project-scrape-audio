import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) return NextResponse.json({ error: "Akun ini menggunakan OAuth, tidak bisa ubah password." }, { status: 400 });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: "Password saat ini salah." }, { status: 400 });

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: newHash } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ChangePassword]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
