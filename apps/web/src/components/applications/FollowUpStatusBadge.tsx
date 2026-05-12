"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FollowUpStatus } from "@/types/application";
import { useTranslation } from "@/i18n/useTranslation";

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

const FOLLOWUP_KEY: Record<FollowUpStatus, string> = {
  "Not Needed": "applications.followUpStatus.notNeeded",
  Scheduled: "applications.followUpStatus.scheduled",
  "Due Today": "applications.followUpStatus.dueToday",
  Overdue: "applications.followUpStatus.overdue",
  Sent: "applications.followUpStatus.sent",
};

export function FollowUpStatusBadge({ status, className }: { status: FollowUpStatus; className?: string }) {
  const { t } = useTranslation();
  return <Badge className={cn(FOLLOWUP_STYLES[status], className)}>{t(FOLLOWUP_KEY[status])}</Badge>;
}
