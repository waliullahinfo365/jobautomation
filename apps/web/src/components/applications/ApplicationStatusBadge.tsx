"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/application";
import { useTranslation } from "@/i18n/useTranslation";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Drafted:
    "bg-[var(--surface-3)] text-[var(--text-2)] border border-[var(--border-default)]",
  Ready:
    "bg-[var(--accent-bg)] text-[var(--accent-hi)] border border-[rgba(99,124,255,0.18)]",
  "In Progress":
    "bg-[var(--amber-bg)] text-[var(--amber)] border border-[rgba(229,162,59,0.18)]",
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

const STATUS_KEY: Record<ApplicationStatus, string> = {
  Drafted: "applications.applicationStatus.drafted",
  Ready: "applications.applicationStatus.ready",
  "In Progress": "applications.applicationStatus.inProgress",
  Applied: "applications.applicationStatus.applied",
  "Follow-Up Due": "applications.applicationStatus.followUpDue",
  Replied: "applications.applicationStatus.replied",
  Interview: "applications.applicationStatus.interview",
  Offer: "applications.applicationStatus.offer",
  Rejected: "applications.applicationStatus.rejected",
  Archived: "applications.applicationStatus.archived",
};

export function ApplicationStatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const { t } = useTranslation();
  return <Badge className={cn(STATUS_STYLES[status], className)}>{t(STATUS_KEY[status])}</Badge>;
}
