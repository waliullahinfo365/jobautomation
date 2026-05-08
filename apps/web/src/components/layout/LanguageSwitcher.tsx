"use client";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";

type Props = {
  /** Compact DE/EN pill for mobile topbar */
  compact?: boolean;
};

export function LanguageSwitcher({ compact }: Props) {
  const { locale, setLocale } = useTranslation();

  function chip(code: Locale, label: string) {
    const active = locale === code;
    return (
      <button
        type="button"
        onClick={() => setLocale(code)}
        className={cn(
          "min-h-10 min-w-[44px] rounded-md px-3 text-sm font-semibold transition-colors",
          compact ? "px-2.5 text-[13px]" : "px-3",
          active
            ? "bg-[var(--accent)] text-white shadow-sm"
            : "text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
        )}
        aria-pressed={active}
        aria-label={label}
      >
        {code.toUpperCase()}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[var(--r-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-1",
        compact && "shrink-0"
      )}
      role="group"
      aria-label="Language"
    >
      {chip("de", "Deutsch")}
      {chip("en", "English")}
    </div>
  );
}
