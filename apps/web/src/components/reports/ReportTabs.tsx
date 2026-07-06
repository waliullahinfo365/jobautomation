"use client";

import { cn } from "@/lib/utils";
import type { ReportTab } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";
import { ScrollableTabBar, ScrollableTabButton } from "@/components/shared/ScrollableTabBar";

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
    <ScrollableTabBar>
      {tabs.map(({ key, i18n }) => (
        <ScrollableTabButton
          key={key}
          onPress={() => onChange(key)}
          className={cn(
            value === key ? "bg-[var(--surface-2)] text-[var(--text-1)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          )}
        >
          {t(i18n)}
        </ScrollableTabButton>
      ))}
    </ScrollableTabBar>
  );
}
