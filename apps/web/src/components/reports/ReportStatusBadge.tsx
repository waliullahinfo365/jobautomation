import type { PDFExportStatus, ReportStatus } from "@/types/report";
import { Badge } from "@/components/ui/badge";

export function ReportStatusBadge({
  status,
  deliveryWarning,
  tooltip,
}: {
  status: ReportStatus | PDFExportStatus;
  /** When digest/report saved but external delivery had warnings */
  deliveryWarning?: boolean;
  /** Optional native tooltip (e.g. PDF preview-only explanation) */
  tooltip?: string;
}) {
  const variant =
    status === "Sent" || status === "Generated" || status === "Exported"
      ? "success"
      : status === "Scheduled" || status === "Pending" || status === "Needs Review" || status === "Preview Only"
        ? "warning"
        : "danger";
  const statusLabel = status === "Preview Only" ? "Text Preview Only" : status;
  const label =
    deliveryWarning === true && (status === "Generated" || status === "Sent")
      ? `${statusLabel} · Delivery warning`
      : statusLabel;
  return (
    <Badge variant={variant} title={tooltip}>
      {label}
    </Badge>
  );
}
