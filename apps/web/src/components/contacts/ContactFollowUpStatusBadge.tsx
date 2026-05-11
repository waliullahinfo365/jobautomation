"use client";

import type { ContactFollowUpStatus } from "@/types/contact";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { contactFollowUpStatusLabelKey } from "./contact-labels";

const styles: Record<ContactFollowUpStatus, string> = {
  "Not Needed": "bg-[var(--surface-3)] text-[var(--text-2)]",
  Scheduled: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  "Due Today": "bg-[var(--amber-bg)] text-[var(--amber)]",
  Overdue: "bg-[var(--rose-bg)] text-[var(--rose)]",
  Completed: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
};

export function ContactFollowUpStatusBadge({ status }: { status: ContactFollowUpStatus }) {
  const { t } = useTranslation();
  return <Badge className={styles[status]}>{t(contactFollowUpStatusLabelKey(status))}</Badge>;
}
