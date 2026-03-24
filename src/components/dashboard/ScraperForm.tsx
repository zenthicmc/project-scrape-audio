"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, AlertCircle, Zap } from "lucide-react";
import { SCRIPT_STYLES, NICHE_OPTIONS } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ScraperFormProps {
  platform: "INSTAGRAM" | "TIKTOK";
  credits: number;
}

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

  const platformLabel = platform === "INSTAGRAM" ? "Instagram" : "TikTok";
  const urlPlaceholder =
    platform === "INSTAGRAM"
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
        router.push(`/dashboard/history?jobId=${data.jobId}`);
      }
    } catch {
      setError(t("dashboard.scraper.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-1.5 block">
          {t("dashboard.scraper.urlLabel")} {platformLabel} <span className="text-destructive">*</span>
        </label>
        <input
          type="url"
          value={form.videoUrl}
          onChange={e => setForm({ ...form, videoUrl: e.target.value })}
          placeholder={urlPlaceholder}
          required
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {language === "id"
            ? `Paste URL lengkap dari video ${platformLabel} yang ingin dijadikan referensi`
            : `Paste the full URL of the ${platformLabel} video you want to use as reference`}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t("dashboard.scraper.topicLabel")}</label>
        <input
          type="text"
          value={form.topic}
          onChange={e => setForm({ ...form, topic: e.target.value })}
          placeholder={t("dashboard.scraper.topicPlaceholder")}
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t("dashboard.scraper.nicheLabel")}</label>
        <select
          value={form.niche}
          onChange={e => setForm({ ...form, niche: e.target.value })}
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
        >
          <option value="">{t("dashboard.scraper.nichePlaceholder")}</option>
          {NICHE_OPTIONS.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          {t("dashboard.scraper.styleLabel")} <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {SCRIPT_STYLES.map(style => (
            <button
              key={style.value}
              type="button"
              onClick={() => setForm({ ...form, style: style.value })}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                form.style === style.value
                  ? "bg-primary text-white border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span>
              {language === "id" ? "Biaya:" : "Cost:"}{" "}
              <strong className="text-foreground">10 credits</strong>
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {language === "id" ? "Sisa:" : "Balance:"}{" "}
            <strong className={credits < 10 ? "text-destructive" : "text-foreground"}>{credits} credits</strong>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || credits < 10}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all glow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />
              {language === "id" ? "Mengirim ke antrian..." : "Adding to queue..."}
            </>
          ) : (
            <><Sparkles className="w-4 h-4" /> {t("dashboard.scraper.generateBtn")}</>
          )}
        </button>

        {credits < 10 && (
          <p className="text-center text-xs text-destructive mt-2">
            {t("dashboard.scraper.insufficientCredits")}{" "}
            <a href="/dashboard/billing" className="underline">{t("dashboard.scraper.topupBtn")}</a>
          </p>
        )}
      </div>
    </form>
  );
}
