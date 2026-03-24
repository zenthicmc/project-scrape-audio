"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { t, language } = useLanguage();
  const [name, setName] = useState(session?.user?.name || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        // Trigger NextAuth session.update() with latest values from API response
        // This updates the JWT token so the new name is reflected everywhere immediately
        await update({ name: data.user?.name ?? name });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(data.error || t("common.errors.generic"));
      }
    } catch {
      setError(t("common.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwError(language === "id" ? "Password baru tidak cocok." : "New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError(language === "id" ? "Password minimal 8 karakter." : "Password must be at least 8 characters.");
      return;
    }
    setPwLoading(true);
    setPwError("");
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPwSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwSaved(false), 2000);
      } else {
        const data = await res.json();
        setPwError(data.error || t("common.errors.generic"));
      }
    } catch {
      setPwError(t("common.errors.generic"));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">{t("dashboard.settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.settings.subtitle")}</p>
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4">{t("dashboard.settings.profileSection")}</h2>
        {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("dashboard.settings.nameLabel")}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("dashboard.settings.emailLabel")}</label>
            <input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === "id" ? "Email tidak dapat diubah" : "Email cannot be changed"}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved
              ? (language === "id" ? "Tersimpan!" : "Saved!")
              : t("dashboard.settings.saveBtn")}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">{t("dashboard.settings.passwordSection")}</h2>
        {pwError && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{pwError}</div>}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("dashboard.settings.currentPassword")}</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("dashboard.settings.newPassword")}</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={language === "id" ? "Min. 8 karakter" : "Min. 8 characters"}
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-foreground"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("dashboard.settings.confirmPassword")}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={language === "id" ? "Ulangi password baru" : "Repeat new password"}
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
            disabled={pwLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-70"
          >
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pwSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {pwSaved
              ? (language === "id" ? "Password Diubah!" : "Password Changed!")
              : t("dashboard.settings.changePasswordBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}
