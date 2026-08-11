import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Customer page shell.
 * Mobile: readable max width.
 * md+: fill the dashboard main column (no leftover phone strip on wide monitors).
 */
export function SimplePageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 w-full space-y-5 pb-4",
        "max-w-lg sm:max-w-xl md:max-w-none",
        className
      )}
    >
      {children}
    </div>
  );
}
