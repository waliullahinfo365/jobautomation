import type { PDFExportType, ReportType } from "@/types/report";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/I18nProvider";

const TYPE_KEY: Record<string, string> = {
  "Daily Digest": "reports.reportType.dailyDigest",
  "Weekly Performance": "reports.reportType.weeklyPerformance",
  "Weekly Report": "reports.reportType.weeklyReport",
  "PDF Export": "reports.reportType.pdfExport",
  "Manual Report": "reports.reportType.manualReport",
  CV: "reports.reportType.cv",
  "Cover Letter": "reports.reportType.coverLetter",
  "Research Document": "reports.reportType.researchDocument",
};

export function ReportTypeBadge({ type }: { type: ReportType | PDFExportType }) {
  const { t } = useTranslation();
  const key = TYPE_KEY[type];
  return <Badge variant="default">{key ? t(key) : type}</Badge>;
}
