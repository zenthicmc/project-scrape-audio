"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const { t, language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    error === "CredentialsSignin" ? t("auth.login.errors.invalidCredentials") : error ? t("auth.login.errors.generic") : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setErrorMsg(
        result.error === "CredentialsSignin"
          ? t("auth.login.errors.invalidCredentials")
          : result.error === "EmailNotVerified"
          ? t("auth.login.errors.emailNotVerified")
          : t("auth.login.errors.generic")
      );
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="w-full max-w-md">
      {/* Theme & Language toggles */}
      <div className="flex justify-end gap-2 mb-6">
        <LanguageToggle size="sm" />
        <ThemeToggle size="sm" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">{t("auth.login.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t("auth.login.subtitle")}</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors mb-6 disabled:opacity-70"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {t("auth.login.googleBtn")}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t("auth.login.orContinueWith")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("auth.login.email")}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t("auth.login.emailPlaceholder")}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">{t("auth.login.password")}</label>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("auth.login.passwordPlaceholder")}
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all glow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t("auth.login.loggingIn")}</> : t("auth.login.loginBtn")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.login.noAccount")}{" "}
          <Link href="/auth/register" className="text-primary hover:underline font-medium">
            {t("auth.login.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
