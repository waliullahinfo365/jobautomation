import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page width shell for simple customer flows.
 * Mobile: comfortable reading width.
 * Desktop: left-aligned within the main column (not a floating centered island).
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
        "max-w-lg sm:max-w-xl",
        "md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}
