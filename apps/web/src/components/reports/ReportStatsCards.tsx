import {
  CalendarDaysIcon,
  Clock3Icon,
  FileBarChart2Icon,
  FileTextIcon,
  GaugeIcon,
  NewspaperIcon,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportStats } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";

export function ReportStatsCards({ stats }: { stats: ReportStats }) {
  const { t } = useTranslation();
  const items = [
    { label: t("reports.reportsGenerated"), value: stats.reportsGenerated, helper: t("reports.stats.totalGeneratedThisMonth"), icon: <FileBarChart2Icon size={20} /> },
    { label: t("reports.dailyDigestsSent"), value: stats.dailyDigestsSent, helper: t("reports.stats.deliveredDailySummaries"), icon: <NewspaperIcon size={20} /> },
    { label: t("reports.weeklyReportsSent"), value: stats.weeklyReportsSent, helper: t("reports.stats.weeklyPerformanceMailouts"), icon: <CalendarDaysIcon size={20} /> },
    { label: t("reports.pdfExports"), value: stats.pdfExports, helper: t("reports.stats.documentsExportedToPdf"), icon: <FileTextIcon size={20} /> },
    { label: t("reports.successRate"), value: `${stats.successRate}%`, helper: t("reports.stats.reportGenerationSuccess"), icon: <GaugeIcon size={20} /> },
    { label: t("reports.lastReport"), value: stats.lastReport, helper: t("reports.stats.mostRecentGeneration"), icon: <Clock3Icon size={20} /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-[var(--text-3)]">{item.label}</p>
                <p className="mt-1 text-xl font-semibold text-[var(--text-1)]">{item.value}</p>
                <p className="mt-1 text-xs text-[var(--text-3)]">{item.helper}</p>
              </div>
              <div className="rounded-lg bg-[var(--accent-bg)] p-2.5 text-[var(--accent-hi)]">{item.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
