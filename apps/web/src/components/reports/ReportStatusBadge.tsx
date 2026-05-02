import type { PDFExportStatus, ReportStatus } from "@/types/report";
import { Badge } from "@/components/ui/badge";

export function ReportStatusBadge({ status }: { status: ReportStatus | PDFExportStatus }) {
  const variant =
    status === "Sent" || status === "Generated" || status === "Exported"
      ? "success"
      : status === "Scheduled" || status === "Pending" || status === "Needs Review"
      ? "warning"
      : "danger";
  return <Badge variant={variant}>{status}</Badge>;
}
