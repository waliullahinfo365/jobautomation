"use client";

import { SunIcon, ThemeIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = (resolvedTheme ?? theme ?? "light") === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "h-[34px] w-[34px] rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]",
        className
      )}
      aria-label={isDark ? t("common.lightMode") : t("common.darkMode")}
    >
      {isDark ? <ThemeIcon size={15} /> : <SunIcon size={15} />}
    </Button>
  );
}
