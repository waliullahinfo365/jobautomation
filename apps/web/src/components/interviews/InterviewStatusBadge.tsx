"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import type { InterviewStatus } from "@/types/interview";

const styles: Record<InterviewStatus, string> = {
  Scheduled: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  "Awaiting Confirmation": "bg-[var(--amber-bg)] text-[var(--amber)]",
  Rescheduled: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Completed: "bg-[var(--surface-3)] text-[var(--text-2)]",
  Cancelled: "bg-[var(--rose-bg)] text-[var(--rose)]",
  "No Show": "bg-[var(--rose-bg)] text-[var(--rose)]",
};

const STATUS_KEY: Record<InterviewStatus, string> = {
  Scheduled: "interviews.interviewStatus.scheduled",
  "Awaiting Confirmation": "interviews.interviewStatus.awaitingConfirmation",
  Rescheduled: "interviews.interviewStatus.rescheduled",
  Completed: "interviews.interviewStatus.completed",
  Cancelled: "interviews.interviewStatus.cancelled",
  "No Show": "interviews.interviewStatus.noShow",
};

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  const { t } = useTranslation();
  return <Badge className={styles[status]}>{t(STATUS_KEY[status])}</Badge>;
}
