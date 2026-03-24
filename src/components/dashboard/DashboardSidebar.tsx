"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Music2, History, CreditCard, Settings, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: "/dashboard/instagram", icon: Instagram, label: t("nav.instagram") },
    { href: "/dashboard/tiktok", icon: Music2, label: t("nav.tiktok") },
    { href: "/dashboard/history", icon: History, label: t("nav.history") },
    { href: "/dashboard/billing", icon: CreditCard, label: t("nav.billing") },
    { href: "/dashboard/settings", icon: Settings, label: t("nav.settings") },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo — same height as topbar (py-3 + content = ~52px) */}
      <div className="h-[52px] flex items-center px-6 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-foreground">ScriptAI</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-xs font-medium text-foreground mb-0.5">
            {t("common.appName")} Support
          </p>
          <p className="text-xs text-muted-foreground">
            {t("common.appName")} v1.0
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — sticky, in-flow, same bg as header */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-background border-r border-border flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-40 p-2 bg-background border border-border rounded-lg shadow-sm"
        aria-label="Open sidebar"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex flex-col z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
