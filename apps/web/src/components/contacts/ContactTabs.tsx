"use client";

import { cn } from "@/lib/utils";
import type { ContactTab } from "@/types/contact";
import { useTranslation } from "@/i18n/useTranslation";

const TAB_ORDER: ContactTab[] = [
  "all",
  "followUpsDue",
  "recruiters",
  "referrals",
  "hiringManagers",
  "archived",
];

export function ContactTabs({ value, onChange }: { value: ContactTab; onChange: (tab: ContactTab) => void }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border/70 bg-muted/70 p-1">
      {TAB_ORDER.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-all duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]",
            value === tab
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {t(`contacts.tabs.${tab}`)}
        </button>
      ))}
    </div>
  );
}
