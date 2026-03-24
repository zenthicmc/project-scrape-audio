import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Instagram, Video, Zap, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Selamat datang, {session.user.name?.split(" ")[0] || "Creator"}! 👋
        </h1>
        <p className="text-muted-foreground">Pilih platform untuk mulai generate script.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link href="/dashboard/instagram" className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-bold text-lg mb-2">Instagram Scraper</h2>
          <p className="text-sm text-muted-foreground mb-4">Scrape transkrip dari Instagram Reels dan ubah jadi script viral.</p>
          <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            Mulai generate <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link href="/dashboard/tiktok" className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-bold text-lg mb-2">TikTok Scraper</h2>
          <p className="text-sm text-muted-foreground mb-4">Scrape transkrip dari TikTok dan ubah jadi script dengan gaya pilihan Anda.</p>
          <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
            Mulai generate <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Cara Menggunakan ScriptAI</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Pilih platform (Instagram atau TikTok)</li>
              <li>Paste URL video yang ingin dijadikan referensi</li>
              <li>Isi topik, niche, dan pilih gaya bahasa</li>
              <li>Klik Generate — tunggu 30-90 detik</li>
              <li>Edit hasil di rich text editor, lalu copy!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
