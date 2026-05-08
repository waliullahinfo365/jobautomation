"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AutomationStatus } from "@/types/automation";
import { useTranslation } from "@/i18n/useTranslation";

const statusStyles: Record<AutomationStatus, string> = {
  Active: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  Paused: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Failed: "bg-[var(--rose-bg)] text-[var(--rose)]",
  "Needs Setup": "bg-[var(--surface-3)] text-[var(--text-2)]",
};

function statusLabel(status: AutomationStatus, t: (key: string) => string): string {
  switch (status) {
    case "Active":
      return t("automation.moduleStatus.active");
    case "Paused":
      return t("automation.moduleStatus.paused");
    case "Failed":
      return t("automation.moduleStatus.failed");
    case "Needs Setup":
      return t("automation.moduleStatus.needsSetup");
    default:
      return status;
  }
}

export function AutomationStatusBadge({ status, className }: { status: AutomationStatus; className?: string }) {
  const { t } = useTranslation();
  return <Badge className={cn(statusStyles[status], className)}>{statusLabel(status, t)}</Badge>;
}
