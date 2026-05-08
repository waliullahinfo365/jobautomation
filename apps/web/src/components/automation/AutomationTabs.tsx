"use client";

import { cn } from "@/lib/utils";
import type { AutomationStatus } from "@/types/automation";
import { useTranslation } from "@/i18n/useTranslation";

export type AutomationTab = "All" | AutomationStatus;

interface AutomationTabsProps {
  value: AutomationTab;
  onChange: (tab: AutomationTab) => void;
}

const tabs: AutomationTab[] = ["All", "Active", "Failed", "Needs Setup", "Paused"];

function tabLabelKey(tab: AutomationTab): string {
  switch (tab) {
    case "All":
      return "automation.tab.all";
    case "Active":
      return "automation.tab.active";
    case "Failed":
      return "automation.tab.failed";
    case "Needs Setup":
      return "automation.tab.needsSetup";
    case "Paused":
      return "automation.tab.paused";
    default:
      return "automation.tab.all";
  }
}

export function AutomationTabs({ value, onChange }: AutomationTabsProps) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center rounded-lg bg-[var(--surface-3)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            value === tab ? "bg-[var(--surface-2)] text-[var(--text-1)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          )}
        >
          {t(tabLabelKey(tab))}
        </button>
      ))}
    </div>
  );
}
