import type { AutomationModule } from "@/types/automation";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function AutomationHealthMetrics({ module }: { module: AutomationModule }) {
  const metrics = [
    { label: "Success Rate", value: `${module.successRate}%` },
    { label: "Total Runs", value: String(module.totalRuns) },
    { label: "Failed Runs", value: String(module.failedRuns) },
    { label: "Last Run", value: module.lastRun ? formatDate(module.lastRun, "MMM d, yyyy HH:mm") : "—" },
    { label: "Average Duration", value: module.averageDuration },
    { label: "Next Scheduled Run", value: module.nextRun ? formatDate(module.nextRun, "MMM d, yyyy HH:mm") : "—" },
  ];

  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-xs text-[var(--text-3)]">{metric.label}</p>
            <p className="text-sm font-semibold text-[var(--text-1)]">{metric.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
