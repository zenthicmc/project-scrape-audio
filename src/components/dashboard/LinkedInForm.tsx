"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, AlertCircle, Zap, Link2, Tag, Layers,
  CheckCircle2, FileText, Users, ToggleLeft, ToggleRight
} from "lucide-react";
import { NICHE_OPTIONS } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LinkedInFormProps {
  credits: number;
}

// LinkedIn-specific style descriptions
const LINKEDIN_STYLE_META: Record<string, { emoji: string; label: string; desc_id: string; desc_en: string }> = {
  PROFESSIONAL: {
    emoji: "💼",
    label: "Professional",
    desc_id: "Tone formal & profesional, lugas dan berbobot",
    desc_en: "Formal & professional tone, clear and authoritative",
  },
  THOUGHT_LEADERSHIP: {
    emoji: "🧠",
    label: "Thought Leadership",
    desc_id: "Perspektif unik, insight mendalam, dorong diskusi",
    desc_en: "Unique perspective, deep insights, drives discussion",
  },
  STORYTELLING_LINKEDIN: {
    emoji: "📖",
    label: "Storytelling",
    desc_id: "Cerita personal yang relatable, lesson learned",
    desc_en: "Relatable personal story with universal lesson",
  },
  FOKUS_BENEFIT: {
    emoji: "✨",
    label: "Fokus Benefit",
    desc_id: "Highlight manfaat konkret & data nyata",
    desc_en: "Highlight concrete benefits & real data",
  },
  SKEPTICAL_HOOK: {
    emoji: "❓",
    label: "Skeptical Hook",
    desc_id: "Tantang asumsi, berikan jawaban mengejutkan",
    desc_en: "Challenge assumptions, surprising answer",
  },
  FOMO_URGENCY: {
    emoji: "🚀",
    label: "FOMO / Urgency",
    desc_id: "Bangun rasa urgensi, dorong action cepat",
    desc_en: "Build urgency & FOMO, drive quick action",
  },
};

type InputMode = "url" | "text";

export default function LinkedInForm({ credits }: LinkedInFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [form, setForm] = useState({
    videoUrl: "",
    linkedinText: "",
    topic: "",
    niche: "",
    targetAudience: "",
    style: "PROFESSIONAL",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === "url" && !form.videoUrl.trim()) {
      setError(language === "id" ? "URL LinkedIn post wajib diisi." : "LinkedIn post URL is required.");
      return;
    }
    if (inputMode === "text" && form.linkedinText.trim().length < 20) {
      setError(language === "id" ? "Teks konten minimal 20 karakter." : "Content text must be at least 20 characters.");
      return;
    }
    if (credits < 10) {
      setError(t("dashboard.scraper.insufficientCredits"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        platform: "LINKEDIN",
        style: form.style,
        topic: form.topic || undefined,
        niche: form.niche || undefined,
        targetAudience: form.targetAudience || undefined,
        videoUrl: inputMode === "url" ? form.videoUrl : "",
        linkedinText: inputMode === "text" ? form.linkedinText : undefined,
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("dashboard.scraper.errors.generic"));
      } else {
        router.push(`/generate/${data.jobId}`);
      }
    } catch {
      setError(t("dashboard.scraper.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Input Mode Toggle */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm font-semibold">
              {language === "id" ? "Sumber Konten" : "Content Source"}
            </span>
          </div>

          {/* Toggle tabs */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${inputMode === "text"
                ? "bg-primary/10 border-primary text-primary ring-1 ring-primary/30"
                : "bg-secondary border-border text-muted-foreground hover:border-primary/40"
                }`}
            >
              <FileText className="w-4 h-4" />
              {language === "id" ? "Tempel Teks" : "Paste Text"}
            </button>
            <button
              type="button"
              onClick={() => setInputMode("url")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${inputMode === "url"
                ? "bg-primary/10 border-primary text-primary ring-1 ring-primary/30"
                : "bg-secondary border-border text-muted-foreground hover:border-primary/40"
                }`}
            >
              <Link2 className="w-4 h-4" />
              {language === "id" ? "URL Post" : "Post URL"}
            </button>
          </div>

          {/* Text paste input */}
          {inputMode === "text" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                {language === "id" ? "Tempel konten LinkedIn Anda di sini" : "Paste your LinkedIn content here"}
                {" "}<span className="text-destructive">*</span>
              </label>
              <textarea
                value={form.linkedinText}
                onChange={e => setForm({ ...form, linkedinText: e.target.value })}
                placeholder={
                  language === "id"
                    ? "Tempel teks postingan LinkedIn yang ingin Anda rewrite atau tingkatkan kualitasnya..."
                    : "Paste the LinkedIn post text you want to rewrite or improve..."
                }
                rows={8}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground transition-all resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {form.linkedinText.length > 0 && (
                  <span className={form.linkedinText.length < 20 ? "text-destructive" : "text-green-400"}>
                    {form.linkedinText.length} {language === "id" ? "karakter" : "characters"}
                    {form.linkedinText.length < 20 && ` (min 20)`}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* URL input */}
          {inputMode === "url" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                {language === "id" ? "URL Post LinkedIn" : "LinkedIn Post URL"}
                {" "}<span className="text-destructive">*</span>
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://www.linkedin.com/posts/username_..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground transition-all"
              />
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{language === "id" ? "Contoh:" : "Example:"}</span>
                  <code className="bg-secondary px-2 py-0.5 rounded text-primary/80 truncate">
                    https://www.linkedin.com/posts/username_...
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Context Information */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm font-semibold">
              {language === "id" ? "Konteks Konten" : "Content Context"}
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
              {language === "id" ? "Topik / Judul" : "Topic / Title"}
            </label>
            <input
              type="text"
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              placeholder={language === "id" ? "Opsional — bantu AI memahami konteks" : "Optional — help AI understand context"}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
              {language === "id" ? "Industri / Niche" : "Industry / Niche"}
            </label>
            <select
              value={form.niche}
              onChange={e => setForm({ ...form, niche: e.target.value })}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
            >
              <option value="">{language === "id" ? "Pilih industri..." : "Select industry..."}</option>
              {NICHE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
              {language === "id" ? "Target Audiens" : "Target Audience"}
            </label>
            <input
              type="text"
              value={form.targetAudience}
              onChange={e => setForm({ ...form, targetAudience: e.target.value })}
              placeholder={
                language === "id"
                  ? "Contoh: HR Manager, Startup Founder, Fresh Graduate..."
                  : "e.g., HR Manager, Startup Founder, Fresh Graduate..."
              }
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground transition-all"
            />
          </div>
        </div>

        {/* Style Selector — LinkedIn specific */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <label className="text-sm font-semibold">
              {language === "id" ? "Gaya Penulisan" : "Writing Style"}{" "}
              <span className="text-destructive">*</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Object.entries(LINKEDIN_STYLE_META).map(([value, meta]) => {
              const isSelected = form.style === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, style: value })}
                  className={`relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${isSelected
                    ? "bg-primary/10 border-primary ring-1 ring-primary/30 shadow-sm"
                    : "bg-secondary border-border hover:border-primary/40 hover:bg-secondary/80"
                    }`}
                >
                  {isSelected && (
                    <CheckCircle2 className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-primary" />
                  )}
                  <span className="text-lg leading-none">{meta.emoji}</span>
                  <span className={`text-xs font-semibold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    {language === "id" ? meta.desc_id : meta.desc_en}
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
            className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === "id" ? "⏳ Memproses konten..." : "⏳ Processing content..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{language === "id" ? "Rewrite Konten LinkedIn" : "Rewrite LinkedIn Content"}</span>
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
