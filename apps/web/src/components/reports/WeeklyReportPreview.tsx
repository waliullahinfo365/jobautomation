import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WeeklyReportData } from "@/types/report";
import { ApplicationsBySourceChart } from "./ApplicationsBySourceChart";
import { ResponseRateTrendChart } from "./ResponseRateTrendChart";
import { PipelineConversionChart } from "./PipelineConversionChart";

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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Preview</CardTitle>
          <CardDescription>{report.weekRange}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Metric label="Total jobs found" value={report.totalJobsFound} />
            <Metric label="Applications submitted" value={report.applicationsSubmitted} />
            <Metric label="Response rate" value={`${report.responseRate}%`} />
            <Metric label="Interview conversion" value={`${report.interviewConversionRate}%`} />
            <Metric label="Offers received" value={report.offersReceived} />
          </div>
          <List title="Top Sources" items={report.topSources.map((s) => `${s.source}: ${s.count}`)} />
          <List title="Best Performing Categories" items={report.bestPerformingCategories} />
          <List title="Bottlenecks / Recommendations" items={report.bottlenecks} />
          <List title="Next Week Focus" items={report.nextWeekFocus} />
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
              {previewLoading ? "Generating…" : "Preview Weekly Report"}
            </Button>
          ) : null}
          {onSendTest ? (
            <Button type="button" variant="secondary" disabled={sendLoading} onClick={() => onSendTest()}>
              {sendLoading ? "Sending…" : "Send Test"}
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
