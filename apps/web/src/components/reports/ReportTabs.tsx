"use client";

import { cn } from "@/lib/utils";
import type { ReportTab } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";

const tabs: { key: ReportTab; i18n: string }[] = [
  { key: "Overview", i18n: "reports.tabs.overview" },
  { key: "Daily Digest", i18n: "reports.tabs.dailyDigest" },
  { key: "Weekly Report", i18n: "reports.tabs.weeklyReport" },
  { key: "PDF Exports", i18n: "reports.tabs.pdfExports" },
  { key: "Report History", i18n: "reports.tabs.reportHistory" },
];

export function ReportTabs({ value, onChange }: { value: ReportTab; onChange: (tab: ReportTab) => void }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center rounded-lg bg-[var(--surface-3)] p-1">
      {tabs.map(({ key, i18n }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            value === key ? "bg-[var(--surface-2)] text-[var(--text-1)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          )}
        >
          {t(i18n)}
        </button>
      ))}
    </div>
  );
}
