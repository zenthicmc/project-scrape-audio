"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Video, History, CreditCard, Settings, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: "/dashboard/instagram", icon: Instagram, label: t("nav.instagram") },
    { href: "/dashboard/tiktok", icon: Video, label: t("nav.tiktok") },
    { href: "/dashboard/history", icon: History, label: t("nav.history") },
    { href: "/dashboard/billing", icon: CreditCard, label: t("nav.billing") },
    { href: "/dashboard/settings", icon: Settings, label: t("nav.settings") },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sidebar-foreground">ScriptAI</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
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
                  ? "bg-sidebar-primary text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-xl p-3">
          <p className="text-xs font-medium text-sidebar-foreground mb-1">
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-sidebar border border-sidebar-border rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
