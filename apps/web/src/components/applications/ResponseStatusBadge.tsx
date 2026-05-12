"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResponseStatus } from "@/types/application";
import { useTranslation } from "@/i18n/useTranslation";

const RESPONSE_STYLES: Record<ResponseStatus, string> = {
  "No Response":
    "bg-[var(--surface-3)] text-[var(--text-2)] border border-[var(--border-default)]",
  "Positive Reply":
    "bg-[var(--emerald-bg)] text-[var(--emerald)] border border-[rgba(56,199,147,0.18)]",
  "Negative Reply":
    "bg-[var(--rose-bg)] text-[var(--rose)] border border-[rgba(229,88,109,0.18)]",
  "Auto Reply":
    "bg-[var(--accent-bg)] text-[var(--accent-hi)] border border-[rgba(99,124,255,0.18)]",
  "Needs Review":
    "bg-[var(--amber-bg)] text-[var(--amber)] border border-[rgba(229,162,59,0.18)]",
};

const RESPONSE_KEY: Record<ResponseStatus, string> = {
  "No Response": "applications.responseStatus.noResponse",
  "Positive Reply": "applications.responseStatus.positiveReply",
  "Negative Reply": "applications.responseStatus.negativeReply",
  "Auto Reply": "applications.responseStatus.autoReply",
  "Needs Review": "applications.responseStatus.needsReview",
};

export function ResponseStatusBadge({ status, className }: { status: ResponseStatus; className?: string }) {
  const { t } = useTranslation();
  return <Badge className={cn(RESPONSE_STYLES[status], className)}>{t(RESPONSE_KEY[status])}</Badge>;
}
