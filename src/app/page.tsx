"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles, Zap, Play, CheckCircle, ArrowRight, Star, TrendingUp,
  ChevronDown, ChevronUp, Globe, Cpu, Edit3, FileText, Shield, Clock
} from "lucide-react";

const STYLE_OPTIONS = [
  { value: "STORY_TELLING", label: "Story telling" },
  { value: "SKEPTICAL_HOOK", label: "Skeptical hook" },
  { value: "FOKUS_BENEFIT", label: "Fokus benefit" },
  { value: "PAS", label: "PAS" },
];

const ALL_STYLES = [
  { value: "ORIGINAL", label: "Original", desc: "Pertahankan gaya asli konten" },
  { value: "MIRIP_REFERENSI", label: "Mirip referensi", desc: "Sesuaikan dengan referensi yang ada" },
  { value: "STORY_TELLING", label: "Story telling", desc: "Narasi berbasis cerita yang engaging" },
  { value: "SKEPTICAL_HOOK", label: "Skeptical hook", desc: "Mulai dengan pertanyaan yang menantang" },
  { value: "FOKUS_BENEFIT", label: "Fokus benefit", desc: "Tonjolkan manfaat utama produk" },
  { value: "PAS", label: "PAS", desc: "Problem-Agitation-Solution framework" },
  { value: "FOKUS_FITUR", label: "Fokus fitur", desc: "Detail fitur dan spesifikasi" },
];

const DUMMY_SCRIPTS: Record<string, string> = {
  STORY_TELLING: `🎬 HOOK:\nBayangkan kamu bangun tidur, dan dalam 5 menit — rutinitas paginya sudah selesai sempurna.\n\n📖 BODY:\nItulah yang terjadi pada saya 3 bulan lalu, ketika pertama kali mencoba produk ini. Dulu, saya adalah orang yang paling males prepare hal-hal sebelum kerja. Tapi semuanya berubah ketika saya menemukan solusi ini.\n\nSetelah 3 bulan konsisten menggunakannya, hasilnya luar biasa. Bukan hanya hemat waktu, tapi kualitas hidupku meningkat drastis.\n\n✅ CTA:\nCoba sekarang dan rasakan perbedaannya! Link di bio 👆`,
  SKEPTICAL_HOOK: `❓ HOOK:\nSerius? Produk ini bisa mengubah rutinitas paginya dalam 5 menit?\n\nSaya juga skeptis awalnya. Tapi setelah 3 bulan — saya tidak bisa hidup tanpanya.\n\n🔥 AGITASI:\nBerapa banyak waktu yang kamu buang setiap pagi karena tidak punya sistem yang tepat? Saya hitung, minimal 45 menit sehari — itu 270 jam per tahun yang terbuang!\n\n💡 SOLUSI:\nInilah jawabannya. Dan hasilnya? Lebih dari yang saya ekspektasikan.\n\n👉 CTA: Cek link di bio untuk info lebih lanjut!`,
  FOKUS_BENEFIT: `✨ 3 MANFAAT UTAMA yang akan kamu rasakan:\n\n1️⃣ Hemat waktu 30 menit setiap pagi\n2️⃣ Rutinitas lebih konsisten dan terstruktur\n3️⃣ Energi lebih tinggi sepanjang hari\n\nSudah 3 bulan saya rasakan manfaatnya — dan ini bukan lebay!\n\n📊 Data nyata: 87% pengguna melaporkan peningkatan produktivitas dalam 2 minggu pertama.\n\n🎯 CTA: Mau merasakan manfaat yang sama? Klik link di bio!`,
  PAS: `😤 PROBLEM:\nKamu capek bangun pagi dan langsung overwhelmed dengan semua yang harus dilakukan?\n\n😱 AGITATION:\nSetiap hari terasa sama — buru-buru, lupa sesuatu, dan sampai kantor sudah stress duluan. Ini bukan cara hidup yang seharusnya!\n\n💡 SOLUTION:\nSetelah mencoba produk ini selama 3 bulan, saya akhirnya menemukan sistem yang benar-benar works. Tidak ada lagi pagi yang kacau.\n\n✅ CTA: Ubah paginya sekarang — link di bio!`,
};

const FAQS = [
  { q: "Bagaimana cara kerja ScriptAI?", a: "ScriptAI menggunakan AI canggih untuk mengekstrak transkrip dari video Instagram & TikTok, lalu memparafrase dengan gaya bahasa pilihan Anda menggunakan Claude AI." },
  { q: "Berapa lama proses generate script?", a: "Proses biasanya memakan waktu 30-90 detik tergantung panjang video. Anda akan mendapat notifikasi real-time saat script selesai." },
  { q: "Apakah kredit bisa expired?", a: "Tidak! Kredit Anda tidak akan expired. Beli sekali, gunakan kapan saja." },
  { q: "Platform video apa saja yang didukung?", a: "Saat ini mendukung Instagram Reels/Posts dan TikTok. Kami terus menambah platform baru." },
  { q: "Apakah bisa edit hasil script?", a: "Ya! Kami menyediakan rich text editor (Tiptap) sehingga Anda bisa mengedit, memformat, dan menyempurnakan script sesuai kebutuhan." },
  { q: "Bagaimana jika proses gagal?", a: "Kredit Anda akan dikembalikan otomatis jika proses gagal. Anda bisa mencoba kembali tanpa biaya tambahan." },
];

export default function LandingPage() {
  const [demoUrl, setDemoUrl] = useState("");
  const [demoStyle, setDemoStyle] = useState("STORY_TELLING");
  const [demoResult, setDemoResult] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleDemoGenerate = () => {
    if (!demoUrl.trim()) setDemoUrl("https://www.tiktok.com/@creator/video/123456789");
    setDemoLoading(true);
    setDemoResult(null);
    setTimeout(() => {
      setDemoLoading(false);
      setDemoResult(DUMMY_SCRIPTS[demoStyle] || DUMMY_SCRIPTS.STORY_TELLING);
    }, 2000);
  };

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
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Cara Kerja</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Harga</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Masuk</button>
            </Link>
            <Link href="/auth/register">
              <button className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors glow">Coba Gratis</button>
            </Link>
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
            <Sparkles className="w-3.5 h-3.5" /> Powered by Claude AI
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            Ubah Video Viral Jadi{" "}
            <span className="gradient-text">Script Siap Pakai</span>{" "}
            dalam 60 Detik
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Scrape transkrip dari Instagram & TikTok, lalu AI kami mengubahnya menjadi script berkualitas tinggi dengan gaya bahasa sesuai niche Anda. Tidak perlu ngetik dari nol lagi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/register">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-all glow">
                <Zap className="w-5 h-5" /> Coba Gratis Sekarang
              </button>
            </Link>
            <a href="#demo">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 border border-border rounded-xl font-semibold text-base hover:bg-secondary transition-colors">
                <Play className="w-5 h-5" /> Lihat Demo
              </button>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["A","B","C","D"].map((l, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 border-2 border-background flex items-center justify-center text-xs font-bold text-white">{l}</div>
                ))}
              </div>
              <span>2,400+ content creator aktif</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              <span className="ml-1">4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>50,000+ script dibuat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20 mb-4">Live Demo</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Coba Langsung Tanpa Login</h2>
            <p className="text-muted-foreground">Rasakan sendiri bagaimana ScriptAI bekerja</p>
          </div>
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">URL Video TikTok / Instagram</label>
                <input
                  type="text"
                  placeholder="https://www.tiktok.com/@creator/video/..."
                  value={demoUrl}
                  onChange={e => setDemoUrl(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Pilih Gaya Bahasa</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STYLE_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setDemoStyle(s.value)}
                      className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                        demoStyle === s.value
                          ? "bg-primary text-white border-primary"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {s.label}
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
                  <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Generating Script...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />Generate Script Demo</>
                )}
              </button>
              {demoResult && (
                <div className="mt-2 p-5 bg-secondary/50 rounded-xl border border-primary/20 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Script berhasil dibuat!</span>
                  </div>
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{demoResult}</pre>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Demo hasil — daftar untuk hasil nyata</span>
                    <Link href="/auth/register">
                      <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                        Daftar Gratis <ArrowRight className="w-3 h-3" />
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
            {[
              { letter: "P", color: "red", title: "Problem", text: "Kamu habiskan berjam-jam menonton video viral, mencatat manual, lalu menulis ulang dari nol. Hasilnya? Capek, tidak konsisten, dan sering stuck di tengah jalan." },
              { letter: "A", color: "orange", title: "Agitation", text: "Sementara kompetitor kamu sudah posting 3x sehari dengan script yang polished, kamu masih berjuang dengan blank page. Setiap hari yang terlewat = engagement yang hilang." },
              { letter: "S", color: "green", title: "Solution", text: "ScriptAI mengotomasi seluruh proses: dari scraping transkrip hingga script siap posting — dalam 60 detik. Fokus pada kreativitas, bukan pekerjaan repetitif." },
            ].map((item) => (
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">Cara Kerja</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">4 Langkah Mudah</h2>
            <p className="text-muted-foreground">Dari video viral ke script siap pakai</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Globe, step: "01", title: "Paste Link", desc: "Copy URL video TikTok atau Instagram yang ingin kamu jadikan referensi" },
              { icon: Cpu, step: "02", title: "Pilih Gaya", desc: "Pilih dari 7 gaya bahasa: Story telling, PAS, Skeptical hook, dan lainnya" },
              { icon: Sparkles, step: "03", title: "Generate", desc: "AI kami scrape transkrip dan memparafrase dengan Claude AI dalam 60 detik" },
              { icon: Edit3, step: "04", title: "Edit Hasil", desc: "Gunakan rich text editor untuk menyempurnakan script sesuai kebutuhan" },
            ].map((item, i) => (
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-medium border border-yellow-500/20 mb-4">Transformasi Nyata</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Before vs After</h2>
            <p className="text-muted-foreground">Lihat perbedaan transkrip mentah vs script AI yang sudah dioptimasi</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm font-medium text-red-400">Transkrip Mentah (Before)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-mono bg-background/50 p-4 rounded-lg">
                Jadi guys, hari ini gue mau share tentang produk yang udah gue pake selama 3 bulan terakhir. Ini beneran game changer buat rutinitas pagi gue. Jadi ceritanya gue tuh orangnya males banget kalau harus prepare banyak hal sebelum kerja...
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Perlu 30-60 menit untuk ditulis ulang manual</span>
              </div>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-medium text-green-400">Script AI (After) — Story Telling Style</span>
              </div>
              <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-background/50 p-4 rounded-lg font-sans">
                {DUMMY_SCRIPTS.STORY_TELLING}
              </pre>
              <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                <Zap className="w-3 h-3" />
                <span>Selesai dalam 60 detik dengan ScriptAI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Untuk Siapa ScriptAI?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: "🎬", title: "Content Creator", desc: "Buat konten lebih cepat, posting lebih konsisten, dan tingkatkan engagement." },
              { icon: "💰", title: "Affiliate Marketer", desc: "Repurpose konten viral jadi script review produk yang convert." },
              { icon: "🏢", title: "Agency", desc: "Handle banyak klien sekaligus dengan workflow yang efisien." },
              { icon: "📰", title: "Media & Publisher", desc: "Ubah video berita jadi artikel atau script podcast dengan cepat." },
            ].map((uc, i) => (
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">7 Gaya Bahasa</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pilih Gaya yang Tepat</h2>
            <p className="text-muted-foreground">Setiap niche punya gaya bahasa yang paling efektif</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {ALL_STYLES.map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.label}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">Harga Transparan</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bayar Sesuai Kebutuhan</h2>
            <p className="text-muted-foreground">Tidak ada langganan bulanan. 1 generate = 10 credits. Beli sekali, pakai kapan saja.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Starter", credits: 100, price: "Rp 49.000", perGen: "Rp 4.900/script", popular: false, features: ["10 script generations", "Semua 7 gaya bahasa", "Rich text editor", "History 30 hari"] },
              { name: "Creator", credits: 300, price: "Rp 129.000", perGen: "Rp 4.300/script", popular: true, features: ["30 script generations", "Semua 7 gaya bahasa", "Rich text editor", "History unlimited", "Priority processing"] },
              { name: "Agency", credits: 1000, price: "Rp 399.000", perGen: "Rp 3.990/script", popular: false, features: ["100 script generations", "Semua 7 gaya bahasa", "Rich text editor", "History unlimited", "Priority processing", "Bulk generate"] },
            ].map((plan, i) => (
              <div key={i} className={`relative bg-card rounded-2xl p-6 border transition-all ${plan.popular ? "border-primary glow scale-105" : "border-border hover:border-primary/40"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">Paling Populer</span>
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <div className="text-3xl font-black mb-1">{plan.price}</div>
                <p className="text-xs text-muted-foreground mb-1">{plan.credits} credits · {plan.perGen}</p>
                <p className="text-xs text-primary mb-6">Credits tidak expired!</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register">
                  <button className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${plan.popular ? "bg-primary text-white hover:bg-primary/90 glow" : "border border-border hover:bg-secondary"}`}>
                    Beli {plan.name}
                  </button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-1">
            <Shield className="w-4 h-4" />
            Pembayaran aman via Midtrans · Kredit dikembalikan jika proses gagal
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan Umum</h2>
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
            Mulai Buat Script Viral{" "}
            <span className="gradient-text">Sekarang</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Bergabung dengan 2,400+ content creator yang sudah menghemat ratusan jam dengan ScriptAI.
          </p>
          <Link href="/auth/register">
            <button className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all glow">
              <Zap className="w-5 h-5" /> Coba Gratis — Tidak Perlu Kartu Kredit
            </button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">Daftar dalam 30 detik · Langsung bisa digunakan</p>
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
          <p className="text-sm text-muted-foreground">© 2024 ScriptAI. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
