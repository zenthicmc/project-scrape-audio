"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="scriptai-theme"
    >
      <LanguageProvider>
        <SessionProvider>{children}</SessionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
