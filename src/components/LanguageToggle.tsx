"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export default function LanguageToggle({ className = "", size = "md" }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const btnSize = size === "sm" ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm";

  return (
    <button
      onClick={() => setLanguage(language === "id" ? "en" : "id")}
      className={`${btnSize} flex items-center gap-1.5 rounded-xl bg-secondary border border-border hover:bg-secondary/80 transition-all font-medium text-foreground ${className}`}
      aria-label={language === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      title={language === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
    >
      <span className="text-base leading-none">
        {language === "id" ? "🇮🇩" : "🇬🇧"}
      </span>
      <span className="font-semibold uppercase tracking-wide">
        {language === "id" ? "ID" : "EN"}
      </span>
    </button>
  );
}
