"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";

export default function RegisterPage() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [phoneCode, setPhoneCode] = useState("+62");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const COUNTRY_CODES = [
    { code: "+62", flag: "🇮🇩", name: "Indonesia" },
    { code: "+1", flag: "🇺🇸", name: "USA" },
    { code: "+44", flag: "🇬🇧", name: "UK" },
    { code: "+60", flag: "🇲🇾", name: "Malaysia" },
    { code: "+65", flag: "🇸🇬", name: "Singapore" },
    { code: "+61", flag: "🇦🇺", name: "Australia" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(t("auth.register.errors.passwordMismatch"));
      return;
    }
    if (form.password.length < 8) {
      setError(t("auth.register.errors.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: phoneCode + form.phone,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("already")) {
          setError(t("auth.register.errors.emailExists"));
        } else {
          setError(data.error || t("auth.register.errors.generic"));
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t("auth.register.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("auth.register.successTitle")}</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {t("auth.register.successMessage")}
          </p>
          <Link href="/auth/login">
            <button className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all">
              {language === "id" ? "Kembali ke Login" : "Back to Login"}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Theme & Language toggles */}
      <div className="flex justify-end gap-2 mb-6">
        <LanguageToggle size="sm" />
        <ThemeToggle size="sm" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">{t("auth.register.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t("auth.register.subtitle")}</p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/dashboard" }); }}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-xl hover:bg-secondary transition-colors mb-6 disabled:opacity-70"
        >
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span className="text-sm font-medium">{t("auth.register.googleBtn")}</span>
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-card px-2">{t("auth.register.orContinueWith")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("auth.register.name")}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={t("auth.register.namePlaceholder")}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("auth.register.email")}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder={t("auth.register.emailPlaceholder")}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("auth.register.phone")}</label>
            <div className="flex gap-2">
              <select
                value={phoneCode}
                onChange={e => setPhoneCode(e.target.value)}
                className="bg-secondary border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-28 text-foreground"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                value={form.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, phone: val });
                }}
                placeholder="81234567890"
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("auth.register.password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={t("auth.register.passwordPlaceholder")}
                required
                minLength={8}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("auth.register.confirmPassword")}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all glow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t("auth.register.registering")}</> : t("auth.register.registerBtn")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
