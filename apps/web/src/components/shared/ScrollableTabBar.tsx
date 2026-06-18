"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollableTabBarProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export function ScrollableTabBar({ children, className, innerClassName }: ScrollableTabBarProps) {
  return (
    <div
      className={cn(
        "-mx-1 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <div className={cn("inline-flex min-w-max items-center gap-1 rounded-lg bg-[var(--surface-3)] p-1", innerClassName)}>
        {children}
      </div>
    </div>
  );
}

export const scrollableTabButtonClass =
  "shrink-0 whitespace-nowrap rounded-md px-3 py-2.5 text-sm transition-colors min-h-[44px] touch-manipulation";
