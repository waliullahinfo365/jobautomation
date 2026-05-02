"use client";

import * as React from "react";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Checkbox({ checked, onCheckedChange, className, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded border transition-colors",
        checked
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--border-default)] bg-[var(--surface-2)] text-transparent",
        className
      )}
      {...props}
    >
      <CheckIcon size={14} className={checked ? "text-white" : "text-transparent"} strokeWidth={2.5} />
    </button>
  );
}
