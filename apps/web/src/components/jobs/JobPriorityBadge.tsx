import { AlertTriangleIcon } from "@/components/icons";
import type { JobPriority } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<JobPriority, string> = {
  Low: "bg-[var(--surface-3)] text-[var(--text-3)]",
  Medium: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  High: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Urgent: "bg-[var(--rose-bg)] text-[var(--rose)]",
};

interface JobPriorityBadgeProps {
  priority: JobPriority;
  className?: string;
}

export function JobPriorityBadge({ priority, className }: JobPriorityBadgeProps) {
  return (
    <Badge className={cn("inline-flex items-center gap-1.5", PRIORITY_STYLES[priority], className)}>
      {priority === "Urgent" ? <AlertTriangleIcon size={14} /> : null}
      {priority}
    </Badge>
  );
}
