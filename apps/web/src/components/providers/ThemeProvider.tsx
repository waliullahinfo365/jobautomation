"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { I18nProvider } from "@/i18n/I18nProvider";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
      <I18nProvider>{children}</I18nProvider>
    </NextThemesProvider>
  );
}
