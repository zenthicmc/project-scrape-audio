import nodemailer from "nodemailer";

const port = parseInt(process.env.SMTP_PORT || "587");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
  secure: port === 465 ? true : process.env.SMTP_SECURE === "true",
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
      <div style="font-family: Inter, 'Segoe UI', sans-serif; background-color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <div style="padding: 32px 32px 0; text-align: center;">
            <div style="display: inline-block; font-size: 24px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px;">ScriptAI</div>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">Halo${name ? `, ${name}` : ""}! 👋</h1>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
              Terima kasih sudah mendaftar di ScriptAI. Klik tombol di bawah untuk memverifikasi email Anda dan mulai membuat script viral!
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3);">
                Verifikasi Email
              </a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
              Link ini akan expired dalam 24 jam.<br>Jika Anda tidak mendaftar, abaikan email ini.
            </p>
          </div>
        </div>
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
      <div style="font-family: Inter, 'Segoe UI', sans-serif; background-color: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <div style="padding: 32px 32px 0; text-align: center;">
            <div style="display: inline-block; font-size: 24px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px;">ScriptAI</div>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">Reset Password 🔒</h1>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
              Halo${name ? ` ${name}` : ""}! Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk membuat password baru.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3);">
                Reset Password
              </a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
              Link ini akan expired dalam 1 jam.<br>Jika Anda tidak meminta reset password, abaikan email ini.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}
