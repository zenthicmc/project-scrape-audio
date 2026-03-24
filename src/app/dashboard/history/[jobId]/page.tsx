"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Instagram, Video, Sparkles, Save, Loader2, RefreshCw,
  CheckCircle, XCircle, Clock
} from "lucide-react";
import Link from "next/link";
import { formatDate, SCRIPT_STYLES } from "@/lib/utils";

const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor"), {
  ssr: false,
  loading: () => <div className="h-96 bg-secondary/30 rounded-xl animate-pulse" />,
});

interface ScriptJob {
  id: string;
  platform: "INSTAGRAM" | "TIKTOK";
  videoUrl: string;
  topic: string | null;
  niche: string | null;
  style: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  transcript: string | null;
  generatedScript: string | null;
  errorMessage: string | null;
  creditsUsed: number;
  createdAt: string;
  completedAt: string | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<ScriptJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editedScript, setEditedScript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
        if (data.job.generatedScript && !editedScript) {
          setEditedScript(data.job.generatedScript);
        }
      }
    } catch {}
    setLoading(false);
  }, [jobId, editedScript]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Poll if pending/processing
  useEffect(() => {
    if (!job || job.status === "COMPLETED" || job.status === "FAILED") return;
    const interval = setInterval(fetchJob, 5000);
    return () => clearInterval(interval);
  }, [job, fetchJob]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedScript: editedScript }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setSaving(false);
  };

  const getStyleLabel = (value: string) =>
    SCRIPT_STYLES.find(s => s.value === value)?.label || value;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-muted-foreground mb-4">Job tidak ditemukan.</p>
        <Link href="/dashboard/history" className="text-primary hover:underline text-sm">Kembali ke History</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/history" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{job.topic || "Script Detail"}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(job.createdAt)}</p>
        </div>
      </div>

      {/* Job Info */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${job.platform === "INSTAGRAM" ? "bg-purple-500/10 text-purple-400" : "bg-cyan-500/10 text-cyan-400"}`}>
            {job.platform === "INSTAGRAM" ? <Instagram className="w-3 h-3" /> : <Video className="w-3 h-3" />}
            {job.platform}
          </div>
          <span className="text-xs bg-secondary px-2.5 py-1 rounded-lg">{getStyleLabel(job.style)}</span>
          {job.niche && <span className="text-xs bg-secondary px-2.5 py-1 rounded-lg">{job.niche}</span>}
          <span className="text-xs text-muted-foreground truncate max-w-xs">{job.videoUrl}</span>
        </div>
      </div>

      {/* Status */}
      {job.status === "PENDING" && (
        <div className="flex items-center gap-3 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl mb-6">
          <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
          <div>
            <p className="font-medium text-sm text-yellow-400">Menunggu diproses</p>
            <p className="text-xs text-muted-foreground">Script Anda sedang dalam antrian. Halaman ini akan otomatis diperbarui.</p>
          </div>
        </div>
      )}

      {job.status === "PROCESSING" && (
        <div className="flex items-center gap-3 p-4 bg-blue-400/10 border border-blue-400/20 rounded-xl mb-6">
          <Loader2 className="w-5 h-5 text-blue-400 shrink-0 animate-spin" />
          <div>
            <p className="font-medium text-sm text-blue-400">Sedang diproses...</p>
            <p className="text-xs text-muted-foreground">AI sedang menganalisis video dan membuat script. Biasanya 30-90 detik.</p>
          </div>
        </div>
      )}

      {job.status === "FAILED" && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
          <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-destructive">Proses Gagal — Kredit Dikembalikan</p>
            <p className="text-xs text-muted-foreground mt-1">{job.errorMessage}</p>
            <Link href={job.platform === "INSTAGRAM" ? "/dashboard/instagram" : "/dashboard/tiktok"} className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
              <RefreshCw className="w-3 h-3" /> Coba lagi
            </Link>
          </div>
        </div>
      )}

      {job.status === "COMPLETED" && job.generatedScript && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <h2 className="font-semibold text-sm">Generated Script</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showTranscript ? "Sembunyikan" : "Lihat"} transkrip asli
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {saved ? "Tersimpan!" : "Simpan"}
              </button>
            </div>
          </div>

          {showTranscript && job.transcript && (
            <div className="mb-4 p-4 bg-secondary/30 border border-border rounded-xl">
              <p className="text-xs font-medium text-muted-foreground mb-2">Transkrip Asli:</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.transcript}</p>
            </div>
          )}

          <TiptapEditor
            content={editedScript || job.generatedScript}
            onChange={setEditedScript}
            editable={true}
            placeholder="Script Anda akan muncul di sini..."
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Selesai pada {job.completedAt ? formatDate(job.completedAt) : "-"}
            </p>
            <Link
              href={job.platform === "INSTAGRAM" ? "/dashboard/instagram" : "/dashboard/tiktok"}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Sparkles className="w-3 h-3" /> Generate script baru
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
