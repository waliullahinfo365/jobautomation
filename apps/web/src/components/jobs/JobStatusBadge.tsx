"use client";

import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";

const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  New: "bg-[var(--surface-3)] text-[var(--text-2)]",
  Saved: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Drafting: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Ready: "bg-[var(--violet-bg)] text-[var(--violet)]",
  Applied: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Interview: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Offer: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  Closed: "bg-[var(--rose-bg)] text-[var(--rose)]",
};

const STATUS_I18N_KEY: Record<JobStatus, string> = {
  New: "jobs.pipeline.new",
  Saved: "jobs.pipeline.saved",
  Drafting: "jobs.pipeline.drafting",
  Ready: "jobs.pipeline.ready",
  Applied: "jobs.pipeline.applied",
  Interview: "jobs.pipeline.interview",
  Offer: "jobs.pipeline.offer",
  Closed: "jobs.pipeline.closed",
};

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const { t } = useTranslation();
  const label = STATUS_I18N_KEY[status] ? t(STATUS_I18N_KEY[status]) : status;

  return (
    <Badge className={cn("inline-flex items-center gap-1.5", JOB_STATUS_COLORS[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </Badge>
  );
}
