"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Instagram, Video, Youtube, Linkedin, Zap, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "Creator";

  const HOW_TO_ID = [
    "Pilih platform (Instagram, TikTok, YouTube Shorts, atau LinkedIn)",
    "Paste URL video atau teks konten yang ingin dijadikan referensi",
    "Isi topik, niche/audiens, dan pilih gaya bahasa",
    "Klik Generate — tunggu 30–90 detik",
    "Edit hasil di rich text editor, lalu copy!",
  ];

  const HOW_TO_EN = [
    "Choose a platform (Instagram, TikTok, YouTube Shorts, or LinkedIn)",
    "Paste the video URL or content text you want to reference",
    "Fill in topic, niche/audience, and choose a writing style",
    "Click Generate — wait 30–90 seconds",
    "Edit the result in the rich text editor, then copy!",
  ];

  const HOW_TO = language === "en" ? HOW_TO_EN : HOW_TO_ID;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          {language === "id" ? `Selamat datang, ${firstName}! 👋` : `Welcome, ${firstName}! 👋`}
        </h1>
        <p className="text-muted-foreground">
          {language === "id" ? "Pilih platform untuk mulai generate atau rewrite konten." : "Choose a platform to start generating or rewriting content."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-8">
        {/* Instagram */}
        <Link href="/dashboard/instagram" className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-bold text-lg mb-2">{t("nav.instagram")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {language === "id"
              ? "Scrape transkrip dari Instagram Reels dan ubah jadi script viral."
              : "Scrape transcripts from Instagram Reels and turn them into viral scripts."}
          </p>
          <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            {language === "id" ? "Mulai sekarang" : "Get started"} <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* TikTok */}
        <Link href="/dashboard/tiktok" className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-bold text-lg mb-2">{t("nav.tiktok")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {language === "id"
              ? "Scrape transkrip dari TikTok dan ubah jadi script dengan gaya pilihan Anda."
              : "Scrape transcripts from TikTok and turn them into scripts with your chosen style."}
          </p>
          <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            {language === "id" ? "Mulai sekarang" : "Get started"} <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* YouTube Shorts */}
        <Link href="/dashboard/youtube" className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
          <span className="absolute top-4 right-4 px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-wide">New</span>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4">
            <Youtube className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-bold text-lg mb-2">{t("nav.youtube")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {language === "id"
              ? "Scrape transkrip dari YouTube Shorts dan buat script yang engaging."
              : "Scrape transcripts from YouTube Shorts and create engaging scripts."}
          </p>
          <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            {language === "id" ? "Mulai sekarang" : "Get started"} <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* LinkedIn */}
        <Link href="/dashboard/linkedin" className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
          <span className="absolute top-4 right-4 px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-wide">New</span>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mb-4">
            <Linkedin className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-bold text-lg mb-2">{t("nav.linkedin")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {language === "id"
              ? "Rewrite konten LinkedIn Anda menjadi lebih profesional dan engaging."
              : "Rewrite your LinkedIn content to be more professional and engaging."}
          </p>
          <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            {language === "id" ? "Mulai sekarang" : "Get started"} <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">
              {language === "id" ? "Cara Menggunakan ScriptAI" : "How to Use ScriptAI"}
            </h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              {HOW_TO.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
