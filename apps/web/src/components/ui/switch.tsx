"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]",
        checked ? "bg-[var(--accent)]" : "bg-[var(--surface-4)]",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
