"use client";

import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/types/document";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";

const colors: Record<DocumentStatus, string> = {
  Draft: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Ready: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Exported: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  Failed: "bg-[var(--rose-bg)] text-[var(--rose)]",
  "Needs Review": "bg-[var(--violet-bg)] text-[var(--violet)]",
  Archived: "bg-[var(--surface-3)] text-[var(--text-2)]",
};

const STATUS_KEY: Record<DocumentStatus, string> = {
  Draft: "documents.documentStatus.draft",
  Ready: "documents.documentStatus.ready",
  Exported: "documents.documentStatus.exported",
  Failed: "documents.documentStatus.failed",
  "Needs Review": "documents.documentStatus.needsReview",
  Archived: "documents.documentStatus.archived",
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const { t } = useTranslation();
  return <Badge className={cn(colors[status], className)}>{t(STATUS_KEY[status])}</Badge>;
}
