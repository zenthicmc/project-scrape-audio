"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatDate, SCRIPT_STYLES } from "@/lib/utils";
import {
  Clock, CheckCircle, XCircle, Loader2, Instagram, Video, Youtube, Linkedin, RefreshCw,
  Eye, RotateCcw
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import Pagination from "@/components/ui/Pagination";

interface ScriptJob {
  id: string;
  platform: "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "LINKEDIN";
  videoUrl: string;
  topic: string | null;
  niche: string | null;
  style: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  creditsUsed: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightJobId = searchParams.get("jobId");
  const { t, language } = useLanguage();
  const [jobs, setJobs] = useState<ScriptJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const LIMIT = 10;

  const STATUS_CONFIG = {
    PENDING: { label: t("dashboard.history.status.PENDING"), icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
    PROCESSING: { label: t("dashboard.history.status.PROCESSING"), icon: Loader2, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
    COMPLETED: { label: t("dashboard.history.status.COMPLETED"), icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
    FAILED: { label: t("dashboard.history.status.FAILED"), icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  };

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs?page=${page}&limit=${LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setTotal(data.total);
      }
    } catch { }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const hasPending = jobs.some(j => j.status === "PENDING" || j.status === "PROCESSING");
    if (!hasPending) return;
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  // BUG FIX #2: Manual retry handler
  const handleRetry = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || (language === "id" ? "Gagal melakukan retry." : "Retry failed."));
        return;
      }

      // Redirect to history with the new job highlighted
      router.push(`/dashboard/history?jobId=${data.jobId}`);
      fetchJobs();
    } catch {
      alert(language === "id" ? "Terjadi kesalahan. Coba lagi." : "An error occurred. Please try again.");
    } finally {
      setRetryingJobId(null);
    }
  };

  const getStyleLabel = (value: string) =>
    SCRIPT_STYLES.find(s => s.value === value)?.label || value;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{t("dashboard.history.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.history.subtitle")}</p>
        </div>
        <button onClick={fetchJobs} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors text-foreground">
          <RefreshCw className="w-4 h-4" /> {language === "id" ? "Refresh" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="font-semibold mb-2">
            {language === "id" ? "Belum ada history" : "No history yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">{t("dashboard.history.noHistory")}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard/instagram" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Instagram
            </Link>
            <Link href="/dashboard/tiktok" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors text-foreground">
              TikTok
            </Link>
            <Link href="/dashboard/youtube" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors text-foreground">
              YouTube Shorts
            </Link>
            <Link href="/dashboard/linkedin" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors text-foreground">
              LinkedIn
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map(job => {
              const statusCfg = STATUS_CONFIG[job.status];
              const isHighlighted = job.id === highlightJobId;
              const isRetrying = retryingJobId === job.id;
              return (
                <div
                  key={job.id}
                  className={`bg-card border rounded-xl p-4 transition-all ${isHighlighted ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-border/80"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${job.platform === "INSTAGRAM" ? "bg-gradient-to-br from-purple-500 to-pink-500" :
                          job.platform === "TIKTOK" ? "bg-gradient-to-br from-cyan-500 to-blue-500" :
                            job.platform === "YOUTUBE" ? "bg-gradient-to-br from-red-700 to-red-500" :
                              "bg-gradient-to-br from-blue-600 to-blue-800"
                        }`}>
                        {job.platform === "INSTAGRAM" ? <Instagram className="w-4 h-4 text-white" /> :
                          job.platform === "TIKTOK" ? <Video className="w-4 h-4 text-white" /> :
                            job.platform === "YOUTUBE" ? <Youtube className="w-4 h-4 text-white" /> :
                              <Linkedin className="w-4 h-4 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {job.topic || (job.platform === "LINKEDIN" ? "LinkedIn Content" : job.videoUrl)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{getStyleLabel(job.style)}</span>
                          {job.niche && <span className="text-xs text-muted-foreground">· {job.niche}</span>}
                          <span className="text-xs text-muted-foreground">· {formatDate(job.createdAt)}</span>
                          <span className="text-xs text-muted-foreground">· {job.creditsUsed} credits</span>
                        </div>
                        {job.status === "FAILED" && job.errorMessage && (
                          <p className="text-xs text-destructive mt-1 line-clamp-2">{job.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                        <statusCfg.icon className={`w-3 h-3 ${job.status === "PROCESSING" ? "animate-spin" : ""}`} />
                        {statusCfg.label}
                      </span>
                      {job.status === "COMPLETED" && (
                        <Link
                          href={`/dashboard/history/${job.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-3 h-3" /> {t("dashboard.history.viewBtn")}
                        </Link>
                      )}
                      {/* BUG FIX #2: Retry button for failed jobs */}
                      {job.status === "FAILED" && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={isRetrying}
                          className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-medium hover:bg-orange-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          title={language === "id" ? "Coba lagi (akan mengurangi 10 kredit)" : "Retry (will deduct 10 credits)"}
                        >
                          {isRetrying ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          {isRetrying
                            ? (language === "id" ? "Retrying..." : "Retrying...")
                            : (language === "id" ? "Retry" : "Retry")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            perPage={LIMIT}
            language={language}
          />
        </>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <HistoryContent />
    </Suspense>
  );
}
