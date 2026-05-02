"use client";

import { cn } from "@/lib/utils";
import type { InterviewTab } from "@/types/interview";

const tabs: InterviewTab[] = ["Upcoming", "Calendar View", "Prep Tasks", "Completed", "Awaiting Confirmation", "Automation Logs"];

export function InterviewTabs({ value, onChange }: { value: InterviewTab; onChange: (tab: InterviewTab) => void }) {
  return (
    <div className="inline-flex flex-wrap items-center rounded-xl border border-border/70 bg-muted/70 p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-all duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]",
            value === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
