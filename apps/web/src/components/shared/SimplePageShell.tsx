import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page width shell.
 * Mobile: comfortable reading width.
 * Desktop/tablet: fill the dashboard main column (do not leave a phone strip).
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
        "mx-auto min-w-0 w-full space-y-5 pb-4",
        "max-w-lg sm:max-w-xl",
        "md:mx-0 md:max-w-none",
        className
      )}
    >
      {children}
    </div>
  );
}
