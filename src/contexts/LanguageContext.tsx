"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import idTranslations from "@/locales/id.json";
import enTranslations from "@/locales/en.json";

export type Language = "id" | "en";

type TranslationValue = string | string[] | Record<string, unknown>;

const translations: Record<Language, Record<string, unknown>> = {
  id: idTranslations as Record<string, unknown>,
  en: enTranslations as Record<string, unknown>,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  tArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): TranslationValue | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current as TranslationValue | undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("scriptai-language") as Language | null;
    if (saved && (saved === "id" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("scriptai-language", lang);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const value = getNestedValue(translations[language], key);
      if (typeof value === "string") return value;
      // Fallback to other language
      const fallbackLang = language === "id" ? "en" : "id";
      const fallbackValue = getNestedValue(translations[fallbackLang], key);
      if (typeof fallbackValue === "string") return fallbackValue;
      return fallback ?? key;
    },
    [language]
  );

  const tArray = useCallback(
    (key: string): string[] => {
      const value = getNestedValue(translations[language], key);
      if (Array.isArray(value)) return value as string[];
      return [];
    },
    [language]
  );

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider
        value={{
          language: "id",
          setLanguage,
          t: (key, fallback) => {
            const value = getNestedValue(translations["id"], key);
            return typeof value === "string" ? value : (fallback ?? key);
          },
          tArray: (key) => {
            const value = getNestedValue(translations["id"], key);
            return Array.isArray(value) ? (value as string[]) : [];
          },
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
