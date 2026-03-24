"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Bell, Zap, ChevronDown, LogOut, Settings, CheckCheck, History, CreditCard } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";

interface TopbarProps {
  user: { name?: string | null; email?: string | null; image?: string | null; id?: string };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId: string | null;
  createdAt: string;
}

export default function DashboardTopbar({ user }: TopbarProps) {
  const { t, language } = useLanguage();
  const [credits, setCredits] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.balance);
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCredits();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchCredits();
      fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-read", { method: "POST" });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "JOB_COMPLETED": return "✅";
      case "JOB_FAILED": return "❌";
      case "PAYMENT_SUCCESS": return "💳";
      case "PAYMENT_FAILED": return "⚠️";
      default: return "🔔";
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-6 h-[52px] flex items-center justify-between gap-4 shrink-0">
      <div className="lg:hidden w-8" />
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Credits */}
        <Link href="/dashboard/billing" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold text-primary">
            {credits !== null ? credits : "..."} {t("dashboard.topbar.credits")}
          </span>
        </Link>



        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-sm">{t("dashboard.notifications.title")}</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <CheckCheck className="w-3 h-3" /> {t("dashboard.notifications.markAllRead")}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {t("dashboard.notifications.noNotifications")}
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors ${!notif.isRead ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg shrink-0">{getNotifIcon(notif.type)}</span>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium hidden sm:block max-w-24 truncate">{user.name || user.email}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="px-3 py-2 border-b border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{language === "id" ? "Bahasa" : "Language"}</span>
                  <LanguageToggle size="sm" className="h-7 text-xs px-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{language === "id" ? "Tampilan" : "Theme"}</span>
                  <ThemeToggle size="sm" className="h-7 w-7" />
                </div>
              </div>
              <div className="py-1">
                <Link href="/dashboard/history" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                  <History className="w-4 h-4" /> {t("nav.history")}
                </Link>
                <Link href="/dashboard/billing" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                  <CreditCard className="w-4 h-4" /> {t("nav.billing")}
                </Link>
                <Link href="/dashboard/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                  <Settings className="w-4 h-4" /> {t("nav.settings")}
                </Link>
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> {t("nav.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
