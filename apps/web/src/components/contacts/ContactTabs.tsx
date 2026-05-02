"use client";

import { cn } from "@/lib/utils";
import type { ContactTab } from "@/types/contact";

const tabs: ContactTab[] = ["All Contacts", "Follow-ups Due", "Recruiters", "Referrals", "Hiring Managers", "Archived"];

export function ContactTabs({ value, onChange }: { value: ContactTab; onChange: (tab: ContactTab) => void }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-border/70 bg-muted/70 p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-all duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]",
            value === tab
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
