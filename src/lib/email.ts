import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || "ScriptAI <noreply@scriptai.app>";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string, name?: string) {
  const verifyUrl = `${BASE_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verifikasi Email Anda — ScriptAI",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #7c3aed; padding: 12px 24px; border-radius: 8px; font-size: 20px; font-weight: 700; color: white;">ScriptAI</div>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Halo${name ? `, ${name}` : ""}! 👋</h1>
        <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
          Terima kasih sudah mendaftar di ScriptAI. Klik tombol di bawah untuk memverifikasi email Anda dan mulai membuat script viral!
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Verifikasi Email
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          Link ini akan expired dalam 24 jam. Jika Anda tidak mendaftar, abaikan email ini.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset Password — ScriptAI",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #7c3aed; padding: 12px 24px; border-radius: 8px; font-size: 20px; font-weight: 700; color: white;">ScriptAI</div>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Reset Password</h1>
        <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
          Halo${name ? ` ${name}` : ""}! Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk membuat password baru.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          Link ini akan expired dalam 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.
        </p>
      </div>
    `,
  });
}
