"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, CheckCircle, XCircle, Copy, Check,
  RefreshCw, ArrowLeft, Zap, Sparkles, FileText, Brain
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link2 from "@tiptap/extension-link";
import { marked } from "marked";
import {
  Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Undo, Redo
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProcessingStatus =
  | "idle"
  | "fetching"
  | "processing"
  | "streaming"
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
  { key: "fetching",   icon: Zap,         labelId: "Mengambil transkrip video...", labelEn: "Fetching transcript..." },
  { key: "processing", icon: Brain,        labelId: "Memproses dengan AI...",       labelEn: "Processing with AI..." },
  { key: "streaming",  icon: Sparkles,     labelId: "Menulis script...",            labelEn: "Writing script..." },
  { key: "completed",  icon: CheckCircle,  labelId: "Selesai!",                     labelEn: "Done!" },
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
          style={{ width: `${60 + (i * 7) % 35}%` }}
        />
      ))}
    </div>
  );
}

// ─── Convert markdown to HTML ─────────────────────────────────────────────────

function markdownToHtml(markdown: string): string {
  marked.setOptions({ breaks: true, gfm: true });
  const result = marked.parse(markdown);
  return typeof result === "string" ? result : "";
}

// ─── Tiptap toolbar button ────────────────────────────────────────────────────

function ToolbarButton({
  onClick, active, title, children, disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        disabled && "opacity-30 cursor-not-allowed",
        !disabled && active
          ? "bg-primary text-white"
          : !disabled
            ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
            : ""
      )}
    >
      {children}
    </button>
  );
}

// ─── Inline Tiptap Editor ─────────────────────────────────────────────────────

function InlineTiptapEditor({
  htmlContent,
  onCopy,
  copied,
  language,
  isEditable,
}: {
  htmlContent: string;
  onCopy: () => void;
  copied: boolean;
  language: string;
  isEditable: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link2.configure({ openOnClick: false }),
    ],
    content: htmlContent,
    editable: isEditable,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[400px]",
      },
    },
  });

  // Update content when htmlContent changes (streaming chunks)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (currentHtml !== htmlContent && htmlContent) {
      editor.commands.setContent(htmlContent, false);
    }
  }, [htmlContent, editor]);

  // Toggle editable when isEditable changes
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(isEditable);
  }, [isEditable, editor]);

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar */}
      <div className={cn(
        "flex flex-wrap items-center gap-1 px-4 py-2 border-b border-border bg-secondary/30 transition-opacity",
        !isEditable && "opacity-50"
      )}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
          disabled={!isEditable}
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
          disabled={!isEditable}
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
          disabled={!isEditable}
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
          disabled={!isEditable}
        >
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
          disabled={!isEditable}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
          disabled={!isEditable}
        >
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
          disabled={!isEditable}
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
          disabled={!isEditable}
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
          disabled={!isEditable}
        >
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
          disabled={!isEditable}
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
          disabled={!isEditable}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
          disabled={!isEditable}
        >
          <Undo className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
          disabled={!isEditable}
        >
          <Redo className="w-3.5 h-3.5" />
        </ToolbarButton>

        {/* Copy button on the right */}
        <div className="ml-auto">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            {copied
              ? <><Check className="w-3.5 h-3.5 text-green-500" /> {language === "id" ? "Tersalin!" : "Copied!"}</>
              : <><Copy className="w-3.5 h-3.5" /> {language === "id" ? "Salin" : "Copy"}</>
            }
          </button>
        </div>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-base dark:prose-invert max-w-none px-8 py-6 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px]"
      />
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
  const [tiptapHtml, setTiptapHtml] = useState("");
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
  }, [tiptapHtml, status]);

  const startStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("fetching");
    setStreamedText("");
    setFinalScript("");
    setTiptapHtml("");
    setError("");

    const es = new EventSource(`/api/generate/${jobId}/stream`);
    eventSourceRef.current = es;

    const safeParse = (eventType: string, raw: string): Record<string, unknown> | null => {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.error(`[SSE Parse Error] event="${eventType}"`, err);
        return null;
      }
    };

    es.onmessage = (e) => {
      console.warn(`[SSE onmessage] unhandled:`, e.data?.substring?.(0, 100));
    };

    es.addEventListener("ping", () => {});

    es.addEventListener("status", (e) => {
      const data = safeParse("status", e.data);
      if (!data) return;
      const s = data.status as string;
      setJobMeta({
        platform: data.platform as string,
        style: data.style as string,
        topic: data.topic as string,
        videoUrl: data.videoUrl as string,
      });
      if (s === "PENDING") setStatus("fetching");
      else if (s === "PROCESSING") setStatus("processing");
      // COMPLETED status from DB → streaming will start via streaming_start event
    });

    es.addEventListener("streaming_start", () => {
      setStatus("streaming");
    });

    es.addEventListener("chunk", (e) => {
      const data = safeParse("chunk", e.data);
      if (!data) return;
      const chunkText = data.text as string;
      setStreamedText(prev => {
        const newText = prev + chunkText;
        // Convert accumulated markdown to HTML for Tiptap in real-time
        const html = markdownToHtml(newText);
        setTiptapHtml(html);
        return newText;
      });
    });

    es.addEventListener("completed", (e) => {
      const data = safeParse("completed", e.data);
      if (!data) {
        setError("Failed to parse completed data");
        setStatus("failed");
        es.close();
        return;
      }
      const script = data.script as string;
      setFinalScript(script);
      setStreamedText(script);
      const html = markdownToHtml(script);
      setTiptapHtml(html);
      setStatus("completed");
      es.close();
    });

    es.addEventListener("failed", (e) => {
      const data = safeParse("failed", e.data);
      if (data) {
        setError((data.error as string) || "Processing failed");
      } else {
        setError(`Processing failed. ${e.data?.substring(0, 200) || ""}`);
      }
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

    es.addEventListener("error", (e) => {
      if (es.readyState === EventSource.CLOSED) return;
      console.error("[SSE] connection error", e);
      setError(language === "id"
        ? "Koneksi terputus. Silakan refresh halaman."
        : "Connection lost. Please refresh the page.");
      setStatus("failed");
      es.close();
    });
  }, [jobId, language]);

  useEffect(() => {
    startStream();
    return () => { eventSourceRef.current?.close(); };
  }, [startStream]);

  // Copy plain text (strip markdown/HTML)
  const handleCopy = async () => {
    const text = finalScript || streamedText;
    if (!text) return;
    const plain = text
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/_{1,2}(.+?)_{1,2}/g, "$1")
      .replace(/---+/g, "")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .trim();
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
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
  const hasOutput = tiptapHtml.length > 0;
  const platformLabel = jobMeta.platform === "INSTAGRAM" ? "Instagram" : jobMeta.platform === "TIKTOK" ? "TikTok" : "";
  const isEditable = status === "completed";

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar — z-50 so it always stays above everything when scrolling */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        <div className="flex items-center gap-2">
          {status === "completed" && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-medium text-green-500">
              <CheckCircle className="w-3 h-3" />
              {language === "id" ? "Selesai" : "Completed"}
            </span>
          )}
          {(status === "failed" || status === "timeout") && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-full text-xs font-medium text-destructive">
              <XCircle className="w-3 h-3" />
              {language === "id" ? "Gagal" : "Failed"}
            </span>
          )}
          {isActive && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-medium text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              {language === "id" ? "Memproses..." : "Processing..."}
            </span>
          )}
        </div>
      </div>

      {/* Main content — z-0 so it scrolls under the sticky header */}
      <div className="relative z-0 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {status === "completed"
              ? <CheckCircle className="w-8 h-8 text-green-500" />
              : (status === "failed" || status === "timeout")
                ? <XCircle className="w-8 h-8 text-destructive" />
                : <Loader2 className="w-8 h-8 text-primary animate-spin" />
            }
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {status === "completed"
              ? (language === "id" ? "Script Siap! 🎉" : "Script Ready! 🎉")
              : (status === "failed" || status === "timeout")
                ? (language === "id" ? "Proses Gagal" : "Process Failed")
                : (language === "id" ? "Membuat Script..." : "Generating Script...")
            }
          </h1>
          <p className="text-muted-foreground text-sm">
            {status === "completed"
              ? (language === "id" ? "Script Anda sudah siap. Edit atau copy di bawah." : "Your script is ready. Edit or copy below.")
              : (status === "failed" || status === "timeout")
                ? (language === "id" ? "Terjadi kesalahan saat memproses." : "An error occurred during processing.")
                : (language === "id" ? "Mohon tunggu, AI sedang bekerja..." : "Please wait, AI is working...")
            }
          </p>
          {(jobMeta.platform || jobMeta.style) && (
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              {jobMeta.platform && <span className="px-2 py-1 bg-secondary rounded-md text-xs">{platformLabel}</span>}
              {jobMeta.style && <span className="px-2 py-1 bg-secondary rounded-md text-xs">{jobMeta.style.replace(/_/g, " ")}</span>}
              {jobMeta.topic && <span className="px-2 py-1 bg-secondary rounded-md text-xs truncate max-w-40">{jobMeta.topic}</span>}
            </div>
          )}
        </div>

        {/* ─── Progress Stepper ──────────────────────────────────────────────── */}
        {(isActive || status === "completed") && (
          <div className="mb-8">
            <div className="relative">
              {/* Track line: left/right offset = 50% of one column (25%/2 = 12.5%) */}
              <div
                className="absolute h-0.5 bg-border"
                style={{ top: "20px", left: "12.5%", right: "12.5%" }}
              />
              {/* Filled progress line */}
              <div
                className="absolute h-0.5 bg-primary transition-all duration-700"
                style={{
                  top: "20px",
                  left: "12.5%",
                  width: currentStepIndex === 0
                    ? "0%"
                    : `calc(${(currentStepIndex / (STEPS.length - 1)) * 75}%)`,
                }}
              />

              {/* Step circles — grid with 4 equal columns */}
              <div className="grid grid-cols-4">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isDone = i < currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                        isDone
                          ? "bg-primary border-primary text-white"
                          : isCurrent
                            ? "bg-background border-primary text-primary"
                            : "bg-background border-border text-muted-foreground"
                      )}>
                        {isDone
                          ? <Check className="w-4 h-4 text-white" />
                          : isCurrent
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Icon className="w-4 h-4" />
                        }
                      </div>
                      <span className={cn(
                        "text-xs font-medium text-center max-w-[80px] leading-tight hidden sm:block",
                        isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {language === "id" ? step.labelId : step.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: show current step label below */}
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
              {isRetrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {language === "id" ? "Coba Lagi" : "Try Again"}
            </button>
          </div>
        )}

        {/* ─── Output area ──────────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Output header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                {language === "id" ? "Hasil Script" : "Generated Script"}
              </span>
              {status === "streaming" && (
                <span className="flex items-center gap-1 text-xs text-primary ml-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>
            {isEditable && (
              <span className="text-xs text-muted-foreground">
                {language === "id" ? "✏️ Klik untuk edit" : "✏️ Click to edit"}
              </span>
            )}
          </div>

          {/* Output content */}
          <div ref={outputRef} className="min-h-[300px] max-h-[80vh] overflow-y-auto">
            {!hasOutput && isActive ? (
              // Skeleton loading while waiting for first chunk
              <SkeletonLines count={10} />

            ) : hasOutput ? (
              // Tiptap editor — shown during streaming (read-only) and completed (editable)
              <InlineTiptapEditor
                htmlContent={tiptapHtml}
                onCopy={handleCopy}
                copied={copied}
                language={language}
                isEditable={isEditable}
              />

            ) : (status === "failed" || status === "timeout") ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <XCircle className="w-10 h-10 mb-3 text-destructive/40" />
                <p className="text-sm">{language === "id" ? "Tidak ada output" : "No output"}</p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {status === "completed" && (
            <div className="px-5 py-4 border-t border-border bg-secondary/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {language === "id"
                  ? "Script disimpan di History. Anda bisa akses kapan saja."
                  : "Script saved to History. You can access it anytime."}
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

        {/* Bottom navigation */}
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
