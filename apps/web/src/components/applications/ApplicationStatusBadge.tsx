import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/application";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Drafted:
    "bg-[var(--surface-3)] text-[var(--text-2)] border border-[var(--border-default)]",
  Ready:
    "bg-[var(--accent-bg)] text-[var(--accent-hi)] border border-[rgba(99,124,255,0.18)]",
  Applied:
    "bg-[var(--accent-bg)] text-[var(--accent)] border border-[rgba(99,124,255,0.18)]",
  "Follow-Up Due":
    "bg-[var(--amber-bg)] text-[var(--amber)] border border-[rgba(229,162,59,0.18)]",
  Replied:
    "bg-[var(--teal-bg)] text-[var(--teal)] border border-[rgba(79,194,216,0.18)]",
  Interview:
    "bg-[var(--violet-bg)] text-[var(--violet)] border border-[rgba(164,124,255,0.18)]",
  Offer:
    "bg-[var(--emerald-bg)] text-[var(--emerald)] border border-[rgba(56,199,147,0.18)]",
  Rejected:
    "bg-[var(--rose-bg)] text-[var(--rose)] border border-[rgba(229,88,109,0.18)]",
  Archived:
    "bg-[var(--surface-3)] text-[var(--text-4)] border border-[var(--border-default)]",
};

export function ApplicationStatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return <Badge className={cn(STATUS_STYLES[status], className)}>{status}</Badge>;
}
