import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WeeklyReportData } from "@/types/report";
import { ApplicationsBySourceChart } from "./ApplicationsBySourceChart";
import { ResponseRateTrendChart } from "./ResponseRateTrendChart";
import { PipelineConversionChart } from "./PipelineConversionChart";
import { useTranslation } from "@/i18n/I18nProvider";

export function WeeklyReportPreview({
  report,
  onSendTest,
  onPreviewWeekly,
  previewLoading,
  sendLoading,
}: {
  report: WeeklyReportData;
  onSendTest?: () => void;
  onPreviewWeekly?: () => void;
  previewLoading?: boolean;
  sendLoading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.weekly.title")}</CardTitle>
          <CardDescription>{report.weekRange}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Metric label={t("reports.weekly.totalJobsFound")} value={report.totalJobsFound} />
            <Metric label={t("reports.weekly.applicationsSubmitted")} value={report.applicationsSubmitted} />
            <Metric label={t("reports.weekly.responseRate")} value={`${report.responseRate}%`} />
            <Metric label={t("reports.weekly.interviewConversion")} value={`${report.interviewConversionRate}%`} />
            <Metric label={t("reports.weekly.offersReceived")} value={report.offersReceived} />
          </div>
          <List title={t("reports.weekly.topSources")} items={report.topSources.map((s) => `${s.source}: ${s.count}`)} />
          <List title={t("reports.weekly.bestPerformingCategories")} items={report.bestPerformingCategories} />
          <List title={t("reports.weekly.bottlenecks")} items={report.bottlenecks} />
          <List title={t("reports.weekly.nextWeekFocus")} items={report.nextWeekFocus} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ApplicationsBySourceChart data={report.applicationsBySource} />
        <ResponseRateTrendChart data={report.responseRateTrend} />
        <PipelineConversionChart data={report.pipelineConversion} />
      </div>

      {onSendTest || onPreviewWeekly ? (
        <div className="flex flex-wrap justify-end gap-2">
          {onPreviewWeekly ? (
            <Button type="button" variant="outline" disabled={previewLoading} onClick={() => onPreviewWeekly()}>
              {previewLoading ? t("reports.generating") : t("reports.weekly.previewWeeklyReport")}
            </Button>
          ) : null}
          {onSendTest ? (
            <Button type="button" variant="secondary" disabled={sendLoading} onClick={() => onSendTest()}>
              {sendLoading ? t("reports.weekly.sending") : t("reports.sendTest")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--text-1)]">{value}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--text-1)]">{title}</p>
      <ul className="mt-1 space-y-1 text-sm text-[var(--text-2)]">
        {items.map((i) => (
          <li key={i}>- {i}</li>
        ))}
      </ul>
    </div>
  );
}
