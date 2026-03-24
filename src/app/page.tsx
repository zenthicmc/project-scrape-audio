"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Sparkles, Zap, Play, CheckCircle, ArrowRight, Star, TrendingUp,
  ChevronDown, ChevronUp, Globe, Cpu, Edit3, FileText, Shield, Clock,
  LayoutDashboard
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";

const STYLE_OPTIONS = [
  { value: "STORY_TELLING" },
  { value: "SKEPTICAL_HOOK" },
  { value: "FOKUS_BENEFIT" },
  { value: "PAS" },
  { value: "FOMO_URGENCY" },
];

const ALL_STYLE_KEYS = [
  "ORIGINAL",
  "MIRIP_REFERENSI",
  "STORY_TELLING",
  "SKEPTICAL_HOOK",
  "FOKUS_BENEFIT",
  "PAS",
  "FOKUS_FITUR",
  "FOMO_URGENCY",
];

const DUMMY_SCRIPTS_ID: Record<string, string> = {
  STORY_TELLING: `🎬 HOOK:\nBayangkan kamu bangun tidur, dan dalam 5 menit — rutinitas paginya sudah selesai sempurna.\n\n📖 BODY:\nItulah yang terjadi pada saya 3 bulan lalu, ketika pertama kali mencoba produk ini. Dulu, saya adalah orang yang paling males prepare hal-hal sebelum kerja. Tapi semuanya berubah ketika saya menemukan solusi ini.\n\nSetelah 3 bulan konsisten menggunakannya, hasilnya luar biasa. Bukan hanya hemat waktu, tapi kualitas hidupku meningkat drastis.\n\n✅ CTA:\nCoba sekarang dan rasakan perbedaannya! Link di bio 👆`,
  SKEPTICAL_HOOK: `❓ HOOK:\nSerius? Produk ini bisa mengubah rutinitas paginya dalam 5 menit?\n\nSaya juga skeptis awalnya. Tapi setelah 3 bulan — saya tidak bisa hidup tanpanya.\n\n🔥 AGITASI:\nBerapa banyak waktu yang kamu buang setiap pagi karena tidak punya sistem yang tepat? Saya hitung, minimal 45 menit sehari — itu 270 jam per tahun yang terbuang!\n\n💡 SOLUSI:\nInilah jawabannya. Dan hasilnya? Lebih dari yang saya ekspektasikan.\n\n👉 CTA: Cek link di bio untuk info lebih lanjut!`,
  FOKUS_BENEFIT: `✨ 3 MANFAAT UTAMA yang akan kamu rasakan:\n\n1️⃣ Hemat waktu 30 menit setiap pagi\n2️⃣ Rutinitas lebih konsisten dan terstruktur\n3️⃣ Energi lebih tinggi sepanjang hari\n\nSudah 3 bulan saya rasakan manfaatnya — dan ini bukan lebay!\n\n📊 Data nyata: 87% pengguna melaporkan peningkatan produktivitas dalam 2 minggu pertama.\n\n🎯 CTA: Mau merasakan manfaat yang sama? Klik link di bio!`,
  PAS: `😤 PROBLEM:\nKamu capek bangun pagi dan langsung overwhelmed dengan semua yang harus dilakukan?\n\n😱 AGITATION:\nSetiap hari terasa sama — buru-buru, lupa sesuatu, dan sampai kantor sudah stress duluan. Ini bukan cara hidup yang seharusnya!\n\n💡 SOLUTION:\nSetelah mencoba produk ini selama 3 bulan, saya akhirnya menemukan sistem yang benar-benar works. Tidak ada lagi pagi yang kacau.\n\n✅ CTA: Ubah paginya sekarang — link di bio!`,
};

const DUMMY_SCRIPTS_EN: Record<string, string> = {
  STORY_TELLING: `🎬 HOOK:\nImagine waking up and finishing your morning routine perfectly in just 5 minutes.\n\n📖 BODY:\nThat's exactly what happened to me 3 months ago when I first tried this product. I used to be the laziest person when it came to preparing before work. But everything changed when I found this solution.\n\nAfter 3 months of consistent use, the results are incredible. Not only do I save time, but my quality of life has improved dramatically.\n\n✅ CTA:\nTry it now and feel the difference! Link in bio 👆`,
  SKEPTICAL_HOOK: `❓ HOOK:\nSeriously? This product can transform your morning routine in 5 minutes?\n\nI was skeptical too at first. But after 3 months — I can't live without it.\n\n🔥 AGITATION:\nHow much time do you waste every morning because you don't have the right system? I calculated at least 45 minutes a day — that's 270 hours per year wasted!\n\n💡 SOLUTION:\nHere's the answer. And the results? Beyond my expectations.\n\n👉 CTA: Check the link in bio for more info!`,
  FOKUS_BENEFIT: `✨ 3 KEY BENEFITS you'll experience:\n\n1️⃣ Save 30 minutes every morning\n2️⃣ More consistent and structured routine\n3️⃣ Higher energy throughout the day\n\nI've felt the benefits for 3 months — and this is no exaggeration!\n\n📊 Real data: 87% of users report increased productivity within the first 2 weeks.\n\n🎯 CTA: Want to experience the same benefits? Click the link in bio!`,
  PAS: `😤 PROBLEM:\nAre you tired of waking up and immediately feeling overwhelmed by everything you need to do?\n\n😱 AGITATION:\nEvery day feels the same — rushing, forgetting things, and arriving at work already stressed. This isn't how life should be!\n\n💡 SOLUTION:\nAfter trying this product for 3 months, I finally found a system that truly works. No more chaotic mornings.\n\n✅ CTA: Transform your mornings now — link in bio!`,
};

export default function LandingPage() {
  const { t, tArray, language } = useLanguage();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [demoUrl, setDemoUrl] = useState("");
  const [demoStyle, setDemoStyle] = useState("STORY_TELLING");
  const [demoResult, setDemoResult] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const DUMMY_SCRIPTS = language === "en" ? DUMMY_SCRIPTS_EN : DUMMY_SCRIPTS_ID;

  const handleDemoGenerate = () => {
    if (!demoUrl.trim()) setDemoUrl("https://www.tiktok.com/@creator/video/123456789");
    setDemoLoading(true);
    setDemoResult(null);
    setTimeout(() => {
      setDemoLoading(false);
      setDemoResult(DUMMY_SCRIPTS[demoStyle] || DUMMY_SCRIPTS.STORY_TELLING);
    }, 2000);
  };

  const FAQS_ID = [
    { q: "Bagaimana cara kerja ScriptAI?", a: "ScriptAI menggunakan AI canggih untuk mengekstrak transkrip dari video Instagram & TikTok, lalu memparafrase dengan gaya bahasa pilihan Anda menggunakan Claude AI." },
    { q: "Berapa lama proses generate script?", a: "Proses biasanya memakan waktu 30-90 detik tergantung panjang video. Anda akan mendapat notifikasi real-time saat script selesai." },
    { q: "Apakah kredit bisa expired?", a: "Tidak! Kredit Anda tidak akan expired. Beli sekali, gunakan kapan saja." },
    { q: "Platform video apa saja yang didukung?", a: "Saat ini mendukung Instagram Reels/Posts dan TikTok. Kami terus menambah platform baru." },
    { q: "Apakah bisa edit hasil script?", a: "Ya! Kami menyediakan rich text editor (Tiptap) sehingga Anda bisa mengedit, memformat, dan menyempurnakan script sesuai kebutuhan." },
    { q: "Bagaimana jika proses gagal?", a: "Kredit Anda akan dikembalikan otomatis jika proses gagal. Anda bisa mencoba kembali tanpa biaya tambahan." },
  ];

  const FAQS_EN = [
    { q: "How does ScriptAI work?", a: "ScriptAI uses advanced AI to extract transcripts from Instagram & TikTok videos, then paraphrases them in your chosen writing style using Claude AI." },
    { q: "How long does the script generation process take?", a: "The process usually takes 30-90 seconds depending on video length. You'll receive real-time notifications when the script is ready." },
    { q: "Do credits expire?", a: "No! Your credits never expire. Buy once, use anytime." },
    { q: "Which video platforms are supported?", a: "Currently supports Instagram Reels/Posts and TikTok. We're continuously adding new platforms." },
    { q: "Can I edit the generated script?", a: "Yes! We provide a rich text editor (Tiptap) so you can edit, format, and refine the script to your needs." },
    { q: "What happens if the process fails?", a: "Your credits will be automatically refunded if the process fails. You can try again at no extra cost." },
  ];

  const FAQS = language === "en" ? FAQS_EN : FAQS_ID;

  const PAS_CONTENT_ID = [
    { letter: "P", color: "red", title: "Problem", text: "Kamu habiskan berjam-jam menonton video viral, mencatat manual, lalu menulis ulang dari nol. Hasilnya? Capek, tidak konsisten, dan sering stuck di tengah jalan." },
    { letter: "A", color: "orange", title: "Agitation", text: "Sementara kompetitor kamu sudah posting 3x sehari dengan script yang polished, kamu masih berjuang dengan blank page. Setiap hari yang terlewat = engagement yang hilang." },
    { letter: "S", color: "green", title: "Solution", text: "ScriptAI mengotomasi seluruh proses: dari scraping transkrip hingga script siap posting — dalam 60 detik. Fokus pada kreativitas, bukan pekerjaan repetitif." },
  ];

  const PAS_CONTENT_EN = [
    { letter: "P", color: "red", title: "Problem", text: "You spend hours watching viral videos, taking notes manually, then rewriting from scratch. The result? Exhaustion, inconsistency, and often getting stuck halfway." },
    { letter: "A", color: "orange", title: "Agitation", text: "While your competitors are posting 3x a day with polished scripts, you're still struggling with a blank page. Every day missed = lost engagement." },
    { letter: "S", color: "green", title: "Solution", text: "ScriptAI automates the entire process: from transcript scraping to ready-to-post script — in 60 seconds. Focus on creativity, not repetitive work." },
  ];

  const PAS_CONTENT = language === "en" ? PAS_CONTENT_EN : PAS_CONTENT_ID;

  const USE_CASES_ID = [
    { icon: "🎬", title: "Content Creator", desc: "Buat konten lebih cepat, posting lebih konsisten, dan tingkatkan engagement." },
    { icon: "💰", title: "Affiliate Marketer", desc: "Repurpose konten viral jadi script review produk yang convert." },
    { icon: "🏢", title: "Agency", desc: "Handle banyak klien sekaligus dengan workflow yang efisien." },
    { icon: "📰", title: "Media & Publisher", desc: "Ubah video berita jadi artikel atau script podcast dengan cepat." },
  ];

  const USE_CASES_EN = [
    { icon: "🎬", title: "Content Creator", desc: "Create content faster, post more consistently, and boost engagement." },
    { icon: "💰", title: "Affiliate Marketer", desc: "Repurpose viral content into converting product review scripts." },
    { icon: "🏢", title: "Agency", desc: "Handle multiple clients simultaneously with an efficient workflow." },
    { icon: "📰", title: "Media & Publisher", desc: "Turn news videos into articles or podcast scripts quickly." },
  ];

  const USE_CASES = language === "en" ? USE_CASES_EN : USE_CASES_ID;

  const HOW_IT_WORKS_ID = [
    { icon: Globe, step: "01", title: "Paste Link", desc: "Copy URL video TikTok atau Instagram yang ingin kamu jadikan referensi" },
    { icon: Cpu, step: "02", title: "Pilih Gaya", desc: "Pilih dari 7 gaya bahasa: Story telling, PAS, Skeptical hook, dan lainnya" },
    { icon: Sparkles, step: "03", title: "Generate", desc: "AI kami scrape transkrip dan memparafrase dengan Claude AI dalam 60 detik" },
    { icon: Edit3, step: "04", title: "Edit Hasil", desc: "Gunakan rich text editor untuk menyempurnakan script sesuai kebutuhan" },
  ];

  const HOW_IT_WORKS_EN = [
    { icon: Globe, step: "01", title: "Paste Link", desc: "Copy the TikTok or Instagram video URL you want to use as reference" },
    { icon: Cpu, step: "02", title: "Choose Style", desc: "Pick from 7 writing styles: Story telling, PAS, Skeptical hook, and more" },
    { icon: Sparkles, step: "03", title: "Generate", desc: "Our AI scrapes the transcript and paraphrases with Claude AI in 60 seconds" },
    { icon: Edit3, step: "04", title: "Edit Result", desc: "Use the rich text editor to refine the script to your needs" },
  ];

  const HOW_IT_WORKS = language === "en" ? HOW_IT_WORKS_EN : HOW_IT_WORKS_ID;


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ScriptAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              {language === "id" ? "Cara Kerja" : "How It Works"}
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              {language === "id" ? "Harga" : "Pricing"}
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle size="sm" />
            <ThemeToggle size="sm" />
            {isLoggedIn ? (
              /* BUG FIX #4: Show Go to Dashboard when user is logged in */
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  {language === "id" ? "Buka Dashboard" : "Go to Dashboard"}
                </button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t("nav.login")}
                  </button>
                </Link>
                <Link href="/auth/register">
                  <button className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors glow">
                    {language === "id" ? "Coba Gratis" : "Try Free"}
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> {t("landing.hero.badge")}
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            {t("landing.hero.title")}{" "}
            <span className="gradient-text">{t("landing.hero.titleHighlight")}</span>{" "}
            {t("landing.hero.titleSuffix")}
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("landing.hero.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-all glow">
                  <LayoutDashboard className="w-5 h-5" />
                  {language === "id" ? "🚀 Buka Dashboard" : "🚀 Go to Dashboard"}
                </button>
              </Link>
            ) : (
              <Link href="/auth/register">
                <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-all glow">
                  <Zap className="w-5 h-5" /> {t("landing.hero.cta")}
                </button>
              </Link>
            )}
            <a href="#demo">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 border border-border rounded-xl font-semibold text-base hover:bg-secondary transition-colors">
                <Play className="w-5 h-5" /> {t("landing.hero.ctaSecondary")}
              </button>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((l, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 border-2 border-background flex items-center justify-center text-xs font-bold text-white">{l}</div>
                ))}
              </div>
              <span>👥 2,400+ {language === "id" ? "content creator aktif" : "active content creators"}</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              <span className="ml-1">⭐ 4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>📝 50,000+ {language === "id" ? "script dibuat" : "scripts created"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20 mb-4">Live Demo</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.demo.title")}</h2>
            <p className="text-muted-foreground">{t("landing.demo.description")}</p>
          </div>
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  {language === "id" ? "URL Video TikTok / Instagram" : "TikTok / Instagram Video URL"}
                </label>
                <input
                  type="text"
                  placeholder={t("landing.demo.urlPlaceholder")}
                  value={demoUrl}
                  onChange={e => setDemoUrl(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  {t("landing.demo.selectStyle")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STYLE_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setDemoStyle(s.value)}
                      className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${demoStyle === s.value
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                    >
                      {t(`styles.${s.value}`)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleDemoGenerate}
                disabled={demoLoading}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all glow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {demoLoading ? (
                  <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />{language === "id" ? "Generating Script..." : "Generating Script..."}</>
                ) : (
                  <><Sparkles className="w-4 h-4" />{t("landing.demo.generateBtn")}</>
                )}
              </button>
              {demoResult && (
                <div className="mt-2 p-5 bg-secondary/50 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      {language === "id" ? "Script berhasil dibuat!" : "Script generated successfully!"}
                    </span>
                  </div>
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{demoResult}</pre>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("landing.demo.disclaimer")}</span>
                    <Link href="/auth/register">
                      <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                        {language === "id" ? "Daftar Gratis" : "Register Free"} <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PAS Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            {PAS_CONTENT.map((item) => (
              <div key={item.letter} className={`bg-${item.color}-500/5 border border-${item.color}-500/20 rounded-2xl p-6`}>
                <div className={`w-10 h-10 rounded-full bg-${item.color}-500/10 flex items-center justify-center mb-4`}>
                  <span className={`text-${item.color}-400 font-bold`}>{item.letter}</span>
                </div>
                <h3 className={`font-bold text-lg mb-3 text-${item.color}-400`}>{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">
              {language === "id" ? "Cara Kerja" : "How It Works"}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {language === "id" ? "⚡ 4 Langkah Mudah" : "⚡ 4 Simple Steps"}
            </h2>
            <p className="text-muted-foreground">
              {language === "id" ? "🎯 Dari video viral ke script siap pakai" : "🎯 From viral video to ready-to-use script"}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors">
                <div className="text-xs font-bold text-primary/60 mb-3">{item.step}</div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-medium border border-yellow-500/20 mb-4">
              {language === "id" ? "Transformasi Nyata" : "Real Transformation"}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.comparison.title")}</h2>
            <p className="text-muted-foreground">
              {language === "id" ? "Lihat perbedaan transkrip mentah vs script AI yang sudah dioptimasi" : "See the difference between raw transcript vs AI-optimized script"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm font-medium text-red-400">{t("landing.comparison.before")}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-mono bg-background/50 p-4 rounded-lg">
                {t("landing.comparison.beforeText")}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{language === "id" ? "Perlu 30-60 menit untuk ditulis ulang manual" : "Takes 30-60 minutes to rewrite manually"}</span>
              </div>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-medium text-green-400">
                  {t("landing.comparison.after")} — Story Telling Style
                </span>
              </div>
              <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-background/50 p-4 rounded-lg font-sans">
                {DUMMY_SCRIPTS.STORY_TELLING}
              </pre>
              <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                <Zap className="w-3 h-3" />
                <span>{language === "id" ? "Selesai dalam 60 detik dengan ScriptAI" : "Done in 60 seconds with ScriptAI"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {language === "id" ? "🎯 Untuk Siapa ScriptAI?" : "🎯 Who Is ScriptAI For?"}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {USE_CASES.map((uc, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors">
                <div className="text-3xl mb-4">{uc.icon}</div>
                <h3 className="font-bold mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Style Variations */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">
              {language === "id" ? "8 Gaya Bahasa" : "8 Writing Styles"}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.styles.title")}</h2>
            <p className="text-muted-foreground">{t("landing.styles.description")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {ALL_STYLE_KEYS.map((key, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{t(`landing.styles.items.${key}.label`)}</h3>
                <p className="text-xs text-muted-foreground">{t(`landing.styles.items.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">
              {language === "id" ? "💰 Harga Terjangkau" : "💰 Affordable Pricing"}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {language === "id" ? "Tanpa Langganan, Bayar Sesuai Pemakaian" : "No Subscription, Pay As You Go"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {language === "id"
                ? "Beli credit sekali, gunakan kapan saja. Tidak ada biaya bulanan, tidak ada komitmen."
                : "Buy credits once, use anytime. No monthly fees, no commitment."}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Main price card */}
            <div className="relative bg-card border-2 border-primary/30 rounded-3xl p-8 md:p-10 overflow-hidden">
              {/* Glow background */}
              <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                {/* Price hero */}
                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">
                    {language === "id" ? "Mulai dari" : "Starting from"}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-lg text-muted-foreground font-medium">Rp</span>
                    <span className="text-6xl md:text-7xl font-black gradient-text leading-none">5.000</span>
                  </div>
                  <p className="text-lg text-muted-foreground mt-2">
                    {language === "id" ? "per script generate" : "per script generation"}
                  </p>
                  <p className="text-sm text-primary font-medium mt-1">
                    {language === "id" ? "☕ Lebih murah dari secangkir kopi!" : "☕ Cheaper than a cup of coffee!"}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-border/50 my-8" />

                {/* Features grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {(language === "id" ? [
                    { icon: "⚡", text: "Bayar sesuai pemakaian" },
                    { icon: "♾️", text: "Credit tidak pernah expired" },
                    { icon: "🎨", text: "Akses semua 7 gaya bahasa" },
                    { icon: "✏️", text: "Rich text editor gratis" },
                    { icon: "🔄", text: "Refund otomatis jika gagal" },
                    { icon: "📜", text: "History tanpa batas" },
                  ] : [
                    { icon: "⚡", text: "Pay per use" },
                    { icon: "♾️", text: "Credits never expire" },
                    { icon: "🎨", text: "Access all 7 writing styles" },
                    { icon: "✏️", text: "Free rich text editor" },
                    { icon: "🔄", text: "Auto refund if process fails" },
                    { icon: "📜", text: "Unlimited history" },
                  ]).map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl">
                      <span className="text-lg">{f.icon}</span>
                      <span className="text-sm font-medium">{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* Top-up options */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-center text-muted-foreground mb-4">
                    {language === "id" ? "Pilih top-up yang cocok untuk kamu:" : "Choose the right top-up for you:"}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { amount: "Rp 10.000", scripts: "4", label: language === "id" ? "Coba Dulu" : "Try It" },
                      { amount: "Rp 50.000", scripts: "20", label: language === "id" ? "Reguler" : "Regular" },
                      { amount: "Rp 200.000", scripts: "80", label: language === "id" ? "Power User" : "Power User" },
                    ].map((opt, i) => (
                      <div key={i} className={`text-center p-4 rounded-xl border transition-all ${i === 1 ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-secondary/30 hover:border-primary/40"}`}>
                        <p className="text-xs text-muted-foreground mb-1">{opt.label}</p>
                        <p className="text-lg font-bold">{opt.amount}</p>
                        <p className="text-xs text-primary font-medium mt-1">≈ {opt.scripts} script</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Link href={isLoggedIn ? "/dashboard/billing" : "/auth/register"}>
                  <button className="w-full py-4 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary/90 transition-all glow flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    {isLoggedIn
                      ? (language === "id" ? "Top Up Credit Sekarang" : "Top Up Credits Now")
                      : (language === "id" ? "Daftar & Mulai Generate" : "Register & Start Generating")}
                  </button>
                </Link>

                {/* Trust signals */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {language === "id" ? "Pembayaran aman via Midtrans" : "Secure payment via Midtrans"}</span>
                  <span>·</span>
                  <span>{language === "id" ? "QRIS, Transfer Bank, Kartu Kredit" : "QRIS, Bank Transfer, Credit Card"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.faq.title")}</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            {language === "id" ? "🚀 Mulai Buat Script Viral " : "🚀 Start Creating Viral Scripts "}
            <span className="gradient-text">{language === "id" ? "Sekarang" : "Now"}</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            {t("landing.cta.description")}
          </p>
          {isLoggedIn ? (
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all glow">
                <LayoutDashboard className="w-5 h-5" /> {language === "id" ? "Buka Dashboard" : "Go to Dashboard"}
              </button>
            </Link>
          ) : (
            <Link href="/auth/register">
              <button className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all glow">
                <Zap className="w-5 h-5" /> {t("landing.cta.btn")}
              </button>
            </Link>
          )}
          <p className="text-sm text-muted-foreground mt-4">{t("landing.cta.note")}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold">ScriptAI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 ScriptAI. {t("landing.footer.rights")}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">{t("landing.footer.privacy")}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t("landing.footer.terms")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
