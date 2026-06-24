"use client";

import { Button } from "@/components/ui/button";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportTypeBadge } from "./ReportTypeBadge";
import type { ReportHistoryRecord } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";

const DELIVERY_LABEL_KEY: Record<string, string> = {
  "Delivery warning": "reports.deliveryLabel.deliveryWarning",
  "Not delivered": "reports.deliveryLabel.notDelivered",
  Delivered: "reports.deliveryLabel.delivered",
  "Preview only": "reports.deliveryLabel.previewOnly",
  Sent: "reports.deliveryLabel.sent",
  Failed: "reports.deliveryLabel.failed",
  Queued: "reports.deliveryLabel.queued",
  "Not sent": "reports.deliveryLabel.notSent",
};

function deliveryLabelRaw(record: ReportHistoryRecord): string {
  if (record.deliveryOutcome === "Delivery warning") return "Delivery warning";
  if (record.deliveryOutcome === "Not delivered") return "Not delivered";
  if (record.deliveryOutcome === "Delivered") return "Delivered";
  if (record.deliveryWarning) return "Delivery warning";
  if (record.previewOnly) return "Preview only";
  if (record.deliveryStatus === "Sent") return "Sent";
  if (record.deliveryStatus === "Failed") return "Failed";
  if (record.deliveryStatus === "Queued") return "Queued";
  return "Not sent";
}

export function ReportHistoryCard({
  record,
  onView,
  onSendTest,
  busyId,
}: {
  record: ReportHistoryRecord;
  onView?: (record: ReportHistoryRecord) => void;
  onSendTest?: (record: ReportHistoryRecord) => void;
  busyId?: string | null;
}) {
  const { t, locale } = useTranslation();
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  const rawLabel = deliveryLabelRaw(record);

  return (
    <article className="mobile-list-card rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-1)]">{record.reportName}</h3>
          <p className="mt-0.5 text-xs text-[var(--text-3)]">{record.sentTo || "—"}</p>
        </div>
        <ReportTypeBadge type={record.type} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <ReportStatusBadge status={record.status} deliveryWarning={record.deliveryWarning} />
        <span className="text-[var(--text-4)]">{fmt(record.generatedAt)}</span>
        <span className="text-[var(--text-3)]">
          {DELIVERY_LABEL_KEY[rawLabel] ? t(DELIVERY_LABEL_KEY[rawLabel]) : rawLabel}
        </span>
      </div>
      <div className="mt-4 mobile-card-actions">
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => onView?.(record)}>
          {t("reports.history.view")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px]"
          onClick={() => onSendTest?.(record)}
          disabled={busyId === record.id}
        >
          {busyId === record.id ? t("reports.history.sending") : t("reports.history.sendTest")}
        </Button>
      </div>
    </article>
  );
}
