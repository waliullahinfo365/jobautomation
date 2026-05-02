"use client";

import { cn } from "@/lib/utils";
import type { AutomationStatus } from "@/types/automation";

export type AutomationTab = "All" | AutomationStatus;

interface AutomationTabsProps {
  value: AutomationTab;
  onChange: (tab: AutomationTab) => void;
}

const tabs: AutomationTab[] = ["All", "Active", "Failed", "Needs Setup", "Paused"];

export function AutomationTabs({ value, onChange }: AutomationTabsProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-[var(--surface-3)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            value === tab ? "bg-[var(--surface-2)] text-[var(--text-1)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
