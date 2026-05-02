import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FollowUpStatus } from "@/types/application";

const FOLLOWUP_STYLES: Record<FollowUpStatus, string> = {
  "Not Needed":
    "bg-[var(--surface-3)] text-[var(--text-2)] border border-[var(--border-default)]",
  Scheduled:
    "bg-[var(--accent-bg)] text-[var(--accent-hi)] border border-[rgba(99,124,255,0.18)]",
  "Due Today":
    "bg-[var(--amber-bg)] text-[var(--amber)] border border-[rgba(229,162,59,0.18)]",
  Overdue:
    "bg-[var(--rose-bg)] text-[var(--rose)] border border-[rgba(229,88,109,0.18)]",
  Sent:
    "bg-[var(--emerald-bg)] text-[var(--emerald)] border border-[rgba(56,199,147,0.18)]",
};

export function FollowUpStatusBadge({ status, className }: { status: FollowUpStatus; className?: string }) {
  return <Badge className={cn(FOLLOWUP_STYLES[status], className)}>{status}</Badge>;
}
