import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Linkedin, Zap, Clock, CheckCircle } from "lucide-react";
import LinkedInForm from "@/components/dashboard/LinkedInForm";

export default async function LinkedInScraperPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const creditBalance = await prisma.creditBalance.findUnique({
    where: { userId: session.user.id },
  });
  const credits = creditBalance?.balance ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-blue-500/5 to-transparent border border-blue-600/20 rounded-2xl p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-600/10 to-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shrink-0">
            <Linkedin className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black">💼 LinkedIn Content Rewriter</h1>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Tingkatkan kualitas konten LinkedIn Anda dengan AI — lebih engaging, lebih profesional
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full border border-border">
                <Zap className="w-3 h-3 text-primary" />
                <span>10 credits/rewrite</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full border border-border">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>10–30 detik</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-3 py-1.5 rounded-full border border-border">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span>Tempel teks atau URL post</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn Form */}
      <LinkedInForm credits={credits} />
    </div>
  );
}
