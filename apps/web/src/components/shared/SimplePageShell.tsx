import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page width shell.
 * Mobile stays readable; tablet/desktop expand into the dashboard main column
 * instead of staying phone-narrow next to the sidebar.
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
        "mx-auto min-w-0 w-full max-w-lg space-y-5 pb-4",
        "sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}
