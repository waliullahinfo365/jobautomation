import type { PDFExportStatus, ReportStatus } from "@/types/report";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/I18nProvider";

const STATUS_KEY: Record<string, string> = {
  Generated: "reports.reportStatus.generated",
  Sent: "reports.reportStatus.sent",
  "Not sent": "reports.reportStatus.notSent",
  "Needs Review": "reports.reportStatus.needsReview",
  Failed: "reports.reportStatus.failed",
  Pending: "reports.reportStatus.pending",
  "Delivery warning": "reports.reportStatus.deliveryWarning",
  Delivered: "reports.reportStatus.delivered",
  Exported: "reports.reportStatus.exported",
  Scheduled: "reports.reportStatus.scheduled",
  Queued: "reports.reportStatus.queued",
  "Preview Only": "reports.reportStatus.previewOnly",
};

export function ReportStatusBadge({
  status,
  deliveryWarning,
  tooltip,
}: {
  status: ReportStatus | PDFExportStatus;
  deliveryWarning?: boolean;
  tooltip?: string;
}) {
  const { t } = useTranslation();
  const variant =
    status === "Sent" || status === "Generated" || status === "Exported"
      ? "success"
      : status === "Scheduled" || status === "Pending" || status === "Needs Review" || status === "Preview Only"
        ? "warning"
        : "danger";
  const statusLabel = STATUS_KEY[status] ? t(STATUS_KEY[status]) : status;
  const label =
    deliveryWarning === true && (status === "Generated" || status === "Sent")
      ? `${statusLabel} · ${t("reports.reportStatus.deliveryWarning")}`
      : statusLabel;
  return (
    <Badge variant={variant} title={tooltip}>
      {label}
    </Badge>
  );
}
