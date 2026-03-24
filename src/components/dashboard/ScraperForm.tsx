"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, AlertCircle, Zap, Link2, Tag, Layers,
  CheckCircle2, FileText
} from "lucide-react";
import { SCRIPT_STYLES, NICHE_OPTIONS } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ScraperFormProps {
  platform: "INSTAGRAM" | "TIKTOK";
  credits: number;
}

// Style descriptions for selectable cards
const STYLE_META: Record<string, { emoji: string; desc_id: string; desc_en: string }> = {
  ORIGINAL: {
    emoji: "📄",
    desc_id: "Pertahankan gaya asli, hanya perbaiki grammar",
    desc_en: "Keep original style, fix grammar only",
  },
  MIRIP_REFERENSI: {
    emoji: "🔗",
    desc_id: "Mirip gaya referensi, sesuai konteks",
    desc_en: "Similar to reference style, context-aware",
  },
  STORY_TELLING: {
    emoji: "📖",
    desc_id: "Narasi cerita yang engaging dengan hook kuat",
    desc_en: "Engaging story narrative with strong hook",
  },
  SKEPTICAL_HOOK: {
    emoji: "❓",
    desc_id: "Tantang asumsi audiens, jawaban mengejutkan",
    desc_en: "Challenge audience assumptions, surprising answer",
  },
  FOKUS_BENEFIT: {
    emoji: "✨",
    desc_id: "Highlight manfaat konkret & data nyata",
    desc_en: "Highlight concrete benefits & real data",
  },
  PAS: {
    emoji: "🎯",
    desc_id: "Problem → Agitation → Solution framework",
    desc_en: "Problem → Agitation → Solution framework",
  },
  FOKUS_FITUR: {
    emoji: "⚙️",
    desc_id: "Detail fitur, spesifikasi & keunggulan",
    desc_en: "Feature details, specs & competitive edge",
  },
};

export default function ScraperForm({ platform, credits }: ScraperFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    videoUrl: "",
    topic: "",
    niche: "",
    style: "STORY_TELLING",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isInstagram = platform === "INSTAGRAM";
  const platformLabel = isInstagram ? "Instagram" : "TikTok";
  const exampleUrl = isInstagram
    ? "https://www.instagram.com/reel/xxxx"
    : "https://www.tiktok.com/@user/video/xxxx";
  const urlPlaceholder = isInstagram
    ? "https://www.instagram.com/reel/..."
    : "https://www.tiktok.com/@creator/video/...";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.videoUrl.trim()) {
      setError(language === "id" ? "URL video wajib diisi." : "Video URL is required.");
      return;
    }
    if (credits < 10) {
      setError(t("dashboard.scraper.insufficientCredits"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, platform }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("dashboard.scraper.errors.generic"));
      } else {
        // Redirect to real-time Processing Page instead of history
        router.push(`/generate/${data.jobId}`);
      }
    } catch {
      setError(t("dashboard.scraper.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  // Empty state — shown when URL is empty and form hasn't been touched
  const showEmptyState = !form.videoUrl && !loading;

  return (
    <div className="space-y-6">
      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state illustration */}
      {showEmptyState && (
        <div className="text-center py-8 px-4 bg-secondary/30 border border-dashed border-border rounded-2xl">
          <div className="text-5xl mb-3">{isInstagram ? "📸" : "🎵"}</div>
          <p className="font-medium text-sm mb-1">
            {language === "id"
              ? "Masukkan link video untuk mulai"
              : "Enter a video link to get started"}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === "id"
              ? `Paste URL video ${platformLabel} di bawah ini`
              : `Paste the ${platformLabel} video URL below`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL Input */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <label className="text-sm font-semibold">
              {t("dashboard.scraper.urlLabel")} {platformLabel}{" "}
              <span className="text-destructive">*</span>
            </label>
          </div>
          <input
            type="url"
            value={form.videoUrl}
            onChange={e => setForm({ ...form, videoUrl: e.target.value })}
            placeholder={urlPlaceholder}
            required
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground transition-all"
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">{language === "id" ? "Contoh:" : "Example:"}</span>
            <code className="bg-secondary px-2 py-0.5 rounded text-primary/80 select-all cursor-pointer"
              onClick={() => setForm({ ...form, videoUrl: exampleUrl })}>
              {exampleUrl}
            </code>
          </div>
        </div>

        {/* Topic & Niche */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm font-semibold">
              {language === "id" ? "Informasi Konten" : "Content Information"}
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
              {t("dashboard.scraper.topicLabel")}
            </label>
            <input
              type="text"
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              placeholder={t("dashboard.scraper.topicPlaceholder")}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
              {t("dashboard.scraper.nicheLabel")}
            </label>
            <select
              value={form.niche}
              onChange={e => setForm({ ...form, niche: e.target.value })}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
            >
              <option value="">{t("dashboard.scraper.nichePlaceholder")}</option>
              {NICHE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Style Selector — Selectable Cards */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <label className="text-sm font-semibold">
              {t("dashboard.scraper.styleLabel")}{" "}
              <span className="text-destructive">*</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {SCRIPT_STYLES.map(style => {
              const meta = STYLE_META[style.value];
              const isSelected = form.style === style.value;
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setForm({ ...form, style: style.value })}
                  className={`relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary ring-1 ring-primary/30 shadow-sm"
                      : "bg-secondary border-border hover:border-primary/40 hover:bg-secondary/80"
                  }`}
                >
                  {isSelected && (
                    <CheckCircle2 className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-primary" />
                  )}
                  <span className="text-lg leading-none">{meta?.emoji}</span>
                  <span className={`text-xs font-semibold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {style.label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {language === "id" ? meta?.desc_id : meta?.desc_en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>
                {language === "id" ? "Biaya:" : "Cost:"}{" "}
                <strong className="text-foreground">10 credits</strong>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {language === "id" ? "Sisa:" : "Balance:"}{" "}
              <strong className={credits < 10 ? "text-destructive" : "text-green-400"}>
                {credits} credits
              </strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || credits < 10}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all glow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === "id" ? "⏳ Processing your script..." : "⏳ Processing your script..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t("dashboard.scraper.generateBtn")}</span>
              </>
            )}
          </button>

          {loading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              {language === "id"
                ? "Mengirim ke antrian pemrosesan..."
                : "Sending to processing queue..."}
            </div>
          )}

          {credits < 10 && !loading && (
            <p className="text-center text-xs text-destructive mt-2">
              {t("dashboard.scraper.insufficientCredits")}{" "}
              <a href="/dashboard/billing" className="underline font-medium">
                {t("dashboard.scraper.topupBtn")}
              </a>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
