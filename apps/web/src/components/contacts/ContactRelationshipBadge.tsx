"use client";

import type { ContactRelationship } from "@/types/contact";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { contactRelationshipLabelKey } from "./contact-labels";

const styles: Record<ContactRelationship, string> = {
  Recruiter: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  "Hiring Manager": "bg-[var(--violet-bg)] text-[var(--violet)]",
  Referral: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  Employee: "bg-[var(--teal-bg)] text-[var(--teal)]",
  Networking: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Other: "bg-[var(--surface-3)] text-[var(--text-2)]",
};

export function ContactRelationshipBadge({ relationship }: { relationship: ContactRelationship }) {
  const { t } = useTranslation();
  return <Badge className={styles[relationship]}>{t(contactRelationshipLabelKey(relationship))}</Badge>;
}
