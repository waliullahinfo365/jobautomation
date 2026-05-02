"use client";

import { cn } from "@/lib/utils";
import type { ReportTab } from "@/types/report";

const tabs: ReportTab[] = ["Overview", "Daily Digest", "Weekly Report", "PDF Exports", "Report History"];

export function ReportTabs({ value, onChange }: { value: ReportTab; onChange: (tab: ReportTab) => void }) {
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
