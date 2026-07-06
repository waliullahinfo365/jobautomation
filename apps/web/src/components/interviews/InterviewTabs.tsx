"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import type { InterviewTab } from "@/types/interview";
import { ScrollableTabBar, ScrollableTabButton } from "@/components/shared/ScrollableTabBar";

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
    <ScrollableTabBar innerClassName="rounded-xl border border-border/70 bg-muted/70 p-1">
      {tabKeys.map(({ key, i18n }) => (
        <ScrollableTabButton
          key={key}
          onPress={() => onChange(key)}
          className={cn(
            "rounded-lg",
            value === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {t(i18n)}
        </ScrollableTabButton>
      ))}
    </ScrollableTabBar>
  );
}
