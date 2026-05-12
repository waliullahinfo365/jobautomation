"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import type { PrepStatus, PrepTaskStatus } from "@/types/interview";

const styles: Record<PrepStatus | PrepTaskStatus, string> = {
  "Not Started": "bg-[var(--surface-3)] text-[var(--text-2)]",
  "In Progress": "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Ready: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  Overdue: "bg-[var(--rose-bg)] text-[var(--rose)]",
  Done: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
};

const STATUS_KEY: Record<PrepStatus | PrepTaskStatus, string> = {
  "Not Started": "interviews.prepStatus.notStarted",
  "In Progress": "interviews.prepStatus.inProgress",
  Ready: "interviews.prepStatus.ready",
  Overdue: "interviews.prepStatus.overdue",
  Done: "interviews.prepStatus.done",
};

export function PrepStatusBadge({ status }: { status: PrepStatus | PrepTaskStatus }) {
  const { t } = useTranslation();
  return <Badge className={styles[status]}>{t(STATUS_KEY[status])}</Badge>;
}
