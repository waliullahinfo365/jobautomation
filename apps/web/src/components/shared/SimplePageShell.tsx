import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SimplePageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto min-w-0 w-full max-w-lg space-y-5 pb-4 md:max-w-xl", className)}>
      {children}
    </div>
  );
}
