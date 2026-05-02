"use client";

import { cn } from "@/lib/utils";
import type { DocumentTab } from "@/types/document";

const tabs: DocumentTab[] = ["All Documents", "CV Library", "Cover Letters", "Research Docs", "PDF Exports", "Folder Automation"];

export function DocumentTabs({ value, onChange }: { value: DocumentTab; onChange: (tab: DocumentTab) => void }) {
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
