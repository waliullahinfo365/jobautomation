import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportHistoryTable } from "./ReportHistoryTable";
import { WeeklyApplicationTrendChart } from "./WeeklyApplicationTrendChart";
import { StatusBreakdownChart } from "./StatusBreakdownChart";
import type { ChartDataPoint, ReportHistoryRecord } from "@/types/report";

interface ReportsOverviewProps {
  summary: {
    applicationsThisWeek: number;
    repliesThisWeek: number;
    interviewsThisWeek: number;
    offersThisWeek: number;
    rejectionRate: number;
    followUpsDue: number;
  };
  weeklyTrendData: { day: string; applications: number }[];
  statusBreakdownData: ChartDataPoint[];
  history: ReportHistoryRecord[];
}

export function ReportsOverview({ summary, weeklyTrendData, statusBreakdownData, history }: ReportsOverviewProps) {
  const stats = [
    ["Applications this week", summary.applicationsThisWeek],
    ["Replies this week", summary.repliesThisWeek],
    ["Interviews this week", summary.interviewsThisWeek],
    ["Offers this week", summary.offersThisWeek],
    ["Rejection rate", `${summary.rejectionRate}%`],
    ["Follow-ups due", summary.followUpsDue],
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Performance Summary</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
              <p className="text-xs text-[var(--text-3)]">{label}</p>
              <p className="text-lg font-semibold text-[var(--text-1)]">{String(value)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><WeeklyApplicationTrendChart data={weeklyTrendData} /></div>
        <div><StatusBreakdownChart data={statusBreakdownData} /></div>
      </div>

      <ReportHistoryTable records={history.slice(0, 5)} />
    </div>
  );
}
