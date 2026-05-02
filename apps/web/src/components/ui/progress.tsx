import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <div
        className="h-full bg-primary transition-all duration-[var(--dur)] [transition-timing-function:var(--ease)]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
