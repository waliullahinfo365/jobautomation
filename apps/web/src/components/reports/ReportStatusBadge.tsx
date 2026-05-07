import type { PDFExportStatus, ReportStatus } from "@/types/report";
import { Badge } from "@/components/ui/badge";

export function ReportStatusBadge({
  status,
  deliveryWarning,
}: {
  status: ReportStatus | PDFExportStatus;
  /** When digest/report saved but external delivery had warnings */
  deliveryWarning?: boolean;
}) {
  const variant =
    status === "Sent" || status === "Generated" || status === "Exported"
      ? "success"
      : status === "Scheduled" || status === "Pending" || status === "Needs Review"
        ? "warning"
        : "danger";
  const label =
    deliveryWarning === true && (status === "Generated" || status === "Sent")
      ? `${status} · Delivery warning`
      : status;
  return <Badge variant={variant}>{label}</Badge>;
}
