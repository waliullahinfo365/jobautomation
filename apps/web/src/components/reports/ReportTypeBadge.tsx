import type { PDFExportType, ReportType } from "@/types/report";
import { Badge } from "@/components/ui/badge";

export function ReportTypeBadge({ type }: { type: ReportType | PDFExportType }) {
  return <Badge variant="default">{type}</Badge>;
}
