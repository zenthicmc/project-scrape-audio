"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, CheckCircle, XCircle, Copy, Check, Edit3,
  RefreshCw, ArrowLeft, Zap, Sparkles, FileText, Brain
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProcessingStatus =
  | "idle"
  | "fetching"       // waiting for worker to pick up
  | "processing"     // worker is running
  | "streaming"      // script is being streamed to UI
  | "completed"
  | "failed"
  | "timeout";

interface JobMeta {
  platform?: string;
  style?: string;
  topic?: string;
  videoUrl?: string;
}

// ─── Progress steps config ────────────────────────────────────────────────────

const STEPS = [
  { key: "fetching",    icon: Zap,       labelId: "Mengambil transkrip video...",   labelEn: "Fetching transcript..." },
  { key: "processing",  icon: Brain,     labelId: "Memproses dengan AI...",          labelEn: "Processing with AI..." },
  { key: "streaming",   icon: Sparkles,  labelId: "Menulis script...",               labelEn: "Writing script..." },
  { key: "completed",   icon: CheckCircle, labelId: "Selesai!",                      labelEn: "Done!" },
];

function getStepIndex(status: ProcessingStatus): number {
  if (status === "fetching" || status === "idle") return 0;
  if (status === "processing") return 1;
  if (status === "streaming") return 2;
  if (status === "completed") return 3;
  return 0;
}

// ─── Skeleton component ───────────────────────────────────────────────────────

function SkeletonLines({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-secondary rounded-full animate-pulse"
          style={{ width: `${60 + Math.random() * 35}%` }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProcessingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const { language } = useLanguage();

  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [streamedText, setStreamedText] = useState("");
  const [finalScript, setFinalScript] = useState("");
  const [jobMeta, setJobMeta] = useState<JobMeta>({});
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll to bottom as text streams in
  useEffect(() => {
    if (outputRef.current && status === "streaming") {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamedText, status]);

  const startStream = useCallback(() => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("fetching");
    setStreamedText("");
    setFinalScript("");
    setError("");

    const es = new EventSource(`/api/generate/${jobId}/stream`);
    eventSourceRef.current = es;

    es.addEventListener("ping", () => {
      // Connection established
    });

    es.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      const s = data.status as string;
      setJobMeta({
        platform: data.platform,
        style: data.style,
        topic: data.topic,
        videoUrl: data.videoUrl,
      });
      if (s === "PENDING") setStatus("fetching");
      else if (s === "PROCESSING") setStatus("processing");
    });

    es.addEventListener("streaming_start", () => {
      setStatus("streaming");
    });

    es.addEventListener("chunk", (e) => {
      const data = JSON.parse(e.data);
      setStreamedText(prev => prev + data.text);
    });

    es.addEventListener("completed", (e) => {
      const data = JSON.parse(e.data);
      setFinalScript(data.script);
      setStreamedText(data.script); // ensure full script shown
      setStatus("completed");
      es.close();
    });

    es.addEventListener("failed", (e) => {
      const data = JSON.parse(e.data);
      setError(data.error || "Processing failed");
      setStatus("failed");
      es.close();
    });

    es.addEventListener("timeout", () => {
      setError(language === "id"
        ? "Proses terlalu lama. Silakan coba lagi."
        : "Processing timed out. Please try again.");
      setStatus("timeout");
      es.close();
    });

    es.addEventListener("error", () => {
      if (es.readyState === EventSource.CLOSED) return;
      setError(language === "id"
        ? "Koneksi terputus. Silakan refresh halaman."
        : "Connection lost. Please refresh the page.");
      setStatus("failed");
      es.close();
    });
  }, [jobId, language]);

  // Start streaming on mount
  useEffect(() => {
    startStream();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [startStream]);

  // Copy handler — copies plain text
  const handleCopy = async () => {
    const text = finalScript || streamedText;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Retry handler
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
      // Redirect to new job — the retry API returns a new jobId
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.jobId) {
        router.push(`/generate/${data.jobId}`);
      } else {
        startStream();
      }
    } catch {
      startStream();
    } finally {
      setIsRetrying(false);
    }
  };

  const currentStepIndex = getStepIndex(status);
  const isActive = status !== "completed" && status !== "failed" && status !== "timeout";
  const hasOutput = streamedText.length > 0;

  const platformLabel = jobMeta.platform === "INSTAGRAM" ? "Instagram" : jobMeta.platform === "TIKTOK" ? "TikTok" : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === "id" ? "Dashboard" : "Dashboard"}
        </Link>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {status === "completed" && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-medium text-green-500">
              <CheckCircle className="w-3 h-3" />
              {language === "id" ? "Selesai" : "Completed"}
            </span>
          )}
          {status === "failed" || status === "timeout" ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-full text-xs font-medium text-destructive">
              <XCircle className="w-3 h-3" />
              {language === "id" ? "Gagal" : "Failed"}
            </span>
          ) : null}
          {isActive && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-medium text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              {language === "id" ? "Memproses..." : "Processing..."}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            {status === "completed"
              ? <CheckCircle className="w-8 h-8 text-green-500" />
              : status === "failed" || status === "timeout"
              ? <XCircle className="w-8 h-8 text-destructive" />
              : <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            }
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {status === "completed"
              ? (language === "id" ? "Script Siap! 🎉" : "Script Ready! 🎉")
              : status === "failed" || status === "timeout"
              ? (language === "id" ? "Proses Gagal" : "Process Failed")
              : (language === "id" ? "Generating Your Script..." : "Generating Your Script...")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "completed"
              ? (language === "id" ? "Script Anda sudah siap. Copy, edit, atau regenerate." : "Your script is ready. Copy, edit, or regenerate.")
              : status === "failed" || status === "timeout"
              ? (language === "id" ? "Terjadi kesalahan saat memproses video Anda." : "An error occurred while processing your video.")
              : (language === "id" ? "AI sedang memproses video kamu — hasilnya akan muncul di bawah" : "AI is processing your video — results will appear below")}
          </p>
          {platformLabel && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-secondary rounded-md">{platformLabel}</span>
              {jobMeta.style && <span className="px-2 py-1 bg-secondary rounded-md">{jobMeta.style.replace(/_/g, " ")}</span>}
              {jobMeta.topic && <span className="px-2 py-1 bg-secondary rounded-md truncate max-w-40">{jobMeta.topic}</span>}
            </div>
          )}
        </div>

        {/* Progress steps */}
        {(isActive || status === "completed") && (
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-700"
                style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * (100 - (10 / STEPS.length))}%` }}
              />

              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isDone = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isDone
                        ? "bg-primary border-primary text-white"
                        : isCurrent
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background border-border text-muted-foreground"
                    }`}>
                      {isDone
                        ? <Check className="w-4 h-4" />
                        : isCurrent
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Icon className="w-4 h-4" />
                      }
                    </div>
                    <span className={`text-xs font-medium text-center max-w-20 leading-tight hidden sm:block ${
                      isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {language === "id" ? step.labelId : step.labelEn}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Mobile current step label */}
            <p className="text-center text-sm text-primary font-medium mt-4 sm:hidden">
              {language === "id" ? STEPS[currentStepIndex]?.labelId : STEPS[currentStepIndex]?.labelEn}
            </p>
          </div>
        )}

        {/* Error state */}
        {(status === "failed" || status === "timeout") && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive mb-1">
                  {language === "id" ? "Proses gagal" : "Process failed"}
                </p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-xl text-sm font-medium hover:bg-destructive/90 transition-all disabled:opacity-70"
            >
              {isRetrying
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              {language === "id" ? "Coba Lagi" : "Try Again"}
            </button>
          </div>
        )}

        {/* Output area */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Output header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                {language === "id" ? "Hasil Script" : "Generated Script"}
              </span>
              {status === "streaming" && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>

            {/* Action buttons — shown when completed */}
            {status === "completed" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5 text-green-500" /> {language === "id" ? "Tersalin!" : "Copied!"}</>
                    : <><Copy className="w-3.5 h-3.5" /> {language === "id" ? "Copy" : "Copy"}</>
                  }
                </button>
                <Link
                  href={`/dashboard/history/${jobId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {language === "id" ? "Edit" : "Edit"}
                </Link>
              </div>
            )}
          </div>

          {/* Output content */}
          <div
            ref={outputRef}
            className="min-h-[300px] max-h-[60vh] overflow-y-auto"
          >
            {!hasOutput && isActive ? (
              // Skeleton loading
              <SkeletonLines count={10} />
            ) : hasOutput ? (
              // Streaming / completed text
              <div className="p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {streamedText}
                  {status === "streaming" && (
                    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                  )}
                </pre>
              </div>
            ) : status === "failed" || status === "timeout" ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <XCircle className="w-10 h-10 mb-3 text-destructive/40" />
                <p className="text-sm">{language === "id" ? "Tidak ada output" : "No output"}</p>
              </div>
            ) : null}
          </div>

          {/* Footer with regenerate */}
          {status === "completed" && (
            <div className="px-5 py-4 border-t border-border bg-secondary/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {language === "id"
                  ? "Script disimpan di History. Anda bisa edit kapan saja."
                  : "Script saved to History. You can edit anytime."}
              </p>
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-60"
              >
                {isRetrying
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />
                }
                {language === "id" ? "Regenerate" : "Regenerate"}
              </button>
            </div>
          )}
        </div>

        {/* Bottom navigation hint */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/dashboard/history" className="hover:text-foreground transition-colors flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {language === "id" ? "Lihat semua history" : "View all history"}
          </Link>
          <span>·</span>
          <Link href="/dashboard/instagram" className="hover:text-foreground transition-colors">
            {language === "id" ? "Generate baru" : "New generation"}
          </Link>
        </div>
      </div>
    </div>
  );
}
