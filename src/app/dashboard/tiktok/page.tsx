import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Video } from "lucide-react";
import ScraperForm from "@/components/dashboard/ScraperForm";

export default async function TikTokScraperPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const creditBalance = await prisma.creditBalance.findUnique({
    where: { userId: session.user.id },
  });
  const credits = creditBalance?.balance ?? 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">TikTok Scraper</h1>
          <p className="text-sm text-muted-foreground">Generate script dari video TikTok</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <ScraperForm platform="TIKTOK" credits={credits} />
      </div>
    </div>
  );
}
