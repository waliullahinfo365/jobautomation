import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AutomationStatus } from "@/types/automation";

const statusStyles: Record<AutomationStatus, string> = {
  Active: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  Paused: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Failed: "bg-[var(--rose-bg)] text-[var(--rose)]",
  "Needs Setup": "bg-[var(--surface-3)] text-[var(--text-2)]",
};

export function AutomationStatusBadge({ status, className }: { status: AutomationStatus; className?: string }) {
  return <Badge className={cn(statusStyles[status], className)}>{status}</Badge>;
}
