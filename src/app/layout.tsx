import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScriptAI — AI Video Script Generator",
  description:
    "Ubah video viral Instagram & TikTok menjadi script siap pakai dalam 60 detik. Powered by Claude AI.",
  keywords: ["script generator", "AI", "TikTok", "Instagram", "content creator", "copywriting"],
  openGraph: {
    title: "ScriptAI — AI Video Script Generator",
    description: "Ubah video viral menjadi script siap pakai dalam 60 detik",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
