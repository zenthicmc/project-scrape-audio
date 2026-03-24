import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Music2, Zap, Clock, CheckCircle } from "lucide-react";
import ScraperForm from "@/components/dashboard/ScraperForm";

export default async function TikTokScraperPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const creditBalance = await prisma.creditBalance.findUnique({
    where: { userId: session.user.id },
  });
  const credits = creditBalance?.balance ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 rounded-2xl p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shrink-0">
            <Music2 className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black">🎵 TikTok Script Generator</h1>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Ambil ide viral TikTok &amp; jadikan kontenmu
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full border border-border">
                <Zap className="w-3 h-3 text-primary" />
                <span>10 credits/generate</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full border border-border">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>30–90 detik</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full border border-border">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>TikTok Videos & Shorts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scraper Form */}
      <ScraperForm platform="TIKTOK" credits={credits} />
    </div>
  );
}
