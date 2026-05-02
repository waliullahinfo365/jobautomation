import { NewspaperIcon } from "@/components/icons";
import type { DailyDigestReport } from "@/types/report";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyDigestCardProps {
  report: DailyDigestReport;
}

export function DailyDigestCard({ report }: DailyDigestCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <NewspaperIcon size={16} className="text-[var(--text-3)]" />
          <CardTitle className="text-sm">Daily Digest · {formatDate(report.date)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>

        <div className="mb-4 grid grid-cols-2 gap-3">
          {[
            { label: "Total Jobs", value: report.totalJobs },
            { label: "Active", value: report.activeJobs },
            { label: "Applied Today", value: report.appliedToday },
            { label: "Pending Follow-ups", value: report.pendingFollowUps },
            { label: "Overdue Deadlines", value: report.overdueDeadlines },
            { label: "Automation Errors", value: report.automationErrors },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
              <p className="text-xs text-[var(--text-3)]">{label}</p>
              <p className="text-lg font-bold text-[var(--text-1)]">{value}</p>
            </div>
          ))}
        </div>

        {report.highlights.length > 0 && (
          <ul className="space-y-1">
            {report.highlights.map((h, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-[var(--text-3)]">
                <span className="text-[var(--accent)]">•</span>
                {h}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
