"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import type { InterviewTab } from "@/types/interview";

const tabKeys: { key: InterviewTab; i18n: string }[] = [
  { key: "Upcoming", i18n: "interviews.tabs.upcoming" },
  { key: "Calendar View", i18n: "interviews.tabs.calendarView" },
  { key: "Prep Tasks", i18n: "interviews.tabs.prepTasks" },
  { key: "Completed", i18n: "interviews.tabs.completed" },
  { key: "Awaiting Confirmation", i18n: "interviews.tabs.awaitingConfirmation" },
  { key: "Automation Logs", i18n: "interviews.tabs.automationLogs" },
];

export function InterviewTabs({ value, onChange }: { value: InterviewTab; onChange: (tab: InterviewTab) => void }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex flex-wrap items-center rounded-xl border border-border/70 bg-muted/70 p-1">
      {tabKeys.map(({ key, i18n }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-all duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]",
            value === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {t(i18n)}
        </button>
      ))}
    </div>
  );
}
