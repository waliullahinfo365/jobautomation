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

export function ReportStatsCards({ stats }: { stats: ReportStats }) {
  const items = [
    { label: "Reports Generated", value: stats.reportsGenerated, helper: "Total generated this month", icon: <FileBarChart2Icon size={20} /> },
    { label: "Daily Digests Sent", value: stats.dailyDigestsSent, helper: "Delivered daily summaries", icon: <NewspaperIcon size={20} /> },
    { label: "Weekly Reports Sent", value: stats.weeklyReportsSent, helper: "Weekly performance mailouts", icon: <CalendarDaysIcon size={20} /> },
    { label: "PDF Exports", value: stats.pdfExports, helper: "Documents exported to PDF", icon: <FileTextIcon size={20} /> },
    { label: "Success Rate", value: `${stats.successRate}%`, helper: "Report generation success", icon: <GaugeIcon size={20} /> },
    { label: "Last Report", value: stats.lastReport, helper: "Most recent generation", icon: <Clock3Icon size={20} /> },
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
