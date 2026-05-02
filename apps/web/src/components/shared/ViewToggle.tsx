"use client";

import { LayoutListIcon, PanelsTopLeftIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "board";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-[var(--r-md)] border border-[var(--border-default)] bg-[var(--surface-1)] p-1">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[var(--r-sm)] px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]",
          value === "table"
            ? "bg-[var(--accent)] text-white shadow-sm"
            : "text-[var(--text-2)] hover:bg-[var(--surface-3)]"
        )}
      >
        <LayoutListIcon size={16} />
        Table View
      </button>
      <button
        type="button"
        onClick={() => onChange("board")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[var(--r-sm)] px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]",
          value === "board"
            ? "bg-[var(--accent)] text-white shadow-sm"
            : "text-[var(--text-2)] hover:bg-[var(--surface-3)]"
        )}
      >
        <PanelsTopLeftIcon size={16} />
        Board View
      </button>
    </div>
  );
}
