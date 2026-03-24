"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export default function ThemeToggle({ className = "", size = "md" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={`rounded-xl bg-secondary border border-border ${size === "sm" ? "w-8 h-8" : "w-10 h-10"} ${className}`}
      />
    );
  }

  const isDark = theme === "dark";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`${btnSize} flex items-center justify-center rounded-xl bg-secondary border border-border hover:bg-secondary/80 transition-all text-foreground ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <Sun className={`${iconSize} text-yellow-400`} />
      ) : (
        <Moon className={`${iconSize} text-slate-600`} />
      )}
    </button>
  );
}
