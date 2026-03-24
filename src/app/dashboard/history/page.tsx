"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatDate, SCRIPT_STYLES } from "@/lib/utils";
import {
  Clock, CheckCircle, XCircle, Loader2, Instagram, Video, RefreshCw,
  ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import Link from "next/link";

interface ScriptJob {
  id: string;
  platform: "INSTAGRAM" | "TIKTOK";
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

const STATUS_CONFIG = {
  PENDING: { label: "Menunggu", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  PROCESSING: { label: "Diproses", icon: Loader2, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  COMPLETED: { label: "Selesai", icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  FAILED: { label: "Gagal", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
};

function HistoryContent() {
  const searchParams = useSearchParams();
  const highlightJobId = searchParams.get("jobId");
  const [jobs, setJobs] = useState<ScriptJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs?page=${page}&limit=${LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setTotal(data.total);
      }
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll for pending/processing jobs
  useEffect(() => {
    const hasPending = jobs.some(j => j.status === "PENDING" || j.status === "PROCESSING");
    if (!hasPending) return;
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  const getStyleLabel = (value: string) =>
    SCRIPT_STYLES.find(s => s.value === value)?.label || value;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">History</h1>
          <p className="text-sm text-muted-foreground">Semua script yang pernah dibuat</p>
        </div>
        <button onClick={fetchJobs} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="font-semibold mb-2">Belum ada history</h3>
          <p className="text-sm text-muted-foreground mb-6">Mulai generate script pertama Anda!</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/instagram" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Instagram Scraper
            </Link>
            <Link href="/dashboard/tiktok" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
              TikTok Scraper
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map(job => {
              const statusCfg = STATUS_CONFIG[job.status];
              const isHighlighted = job.id === highlightJobId;
              return (
                <div
                  key={job.id}
                  className={`bg-card border rounded-xl p-4 transition-all ${isHighlighted ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-border/80"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${job.platform === "INSTAGRAM" ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-cyan-500 to-blue-500"}`}>
                        {job.platform === "INSTAGRAM" ? <Instagram className="w-4 h-4 text-white" /> : <Video className="w-4 h-4 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {job.topic || job.videoUrl}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{getStyleLabel(job.style)}</span>
                          {job.niche && <span className="text-xs text-muted-foreground">· {job.niche}</span>}
                          <span className="text-xs text-muted-foreground">· {formatDate(job.createdAt)}</span>
                        </div>
                        {job.status === "FAILED" && job.errorMessage && (
                          <p className="text-xs text-destructive mt-1 line-clamp-1">{job.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                        <statusCfg.icon className={`w-3 h-3 ${job.status === "PROCESSING" ? "animate-spin" : ""}`} />
                        {statusCfg.label}
                      </span>
                      {job.status === "COMPLETED" && (
                        <Link href={`/dashboard/history/${job.id}`} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
                          <Eye className="w-3 h-3" /> Lihat
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} dari {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
