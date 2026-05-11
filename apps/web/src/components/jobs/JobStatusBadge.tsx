import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/job";
import { Badge } from "@/components/ui/badge";

const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  New: "bg-[var(--surface-3)] text-[var(--text-2)]",
  Research: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Drafting: "bg-[var(--amber-bg)] text-[var(--amber)]",
  "Ready to Apply": "bg-[var(--violet-bg)] text-[var(--violet)]",
  Applied: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Interview: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Offer: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  Rejected: "bg-[var(--rose-bg)] text-[var(--rose)]",
  Archived: "bg-[var(--surface-3)] text-[var(--text-4)]",
};

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
  /** Localized label; defaults to raw `status` when omitted. */
  label?: string;
}

export function JobStatusBadge({ status, className, label }: JobStatusBadgeProps) {
  return (
    <Badge className={cn("inline-flex items-center gap-1.5", JOB_STATUS_COLORS[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? status}
    </Badge>
  );
}
