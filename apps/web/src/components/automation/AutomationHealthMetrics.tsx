import type { AutomationModule } from "@/types/automation";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";

export function AutomationHealthMetrics({ module }: { module: AutomationModule }) {
  const { t } = useTranslation();
  const metrics = [
    { label: t("automation.moduleCard.successRate"), value: module.totalRuns > 0 ? `${module.successRate}%` : "—" },
    { label: t("automation.moduleCard.totalRunsLabel"), value: String(module.totalRuns) },
    { label: t("automation.moduleCard.failedRunsLabel"), value: String(module.failedRuns) },
    { label: t("automation.moduleCard.lastRun"), value: module.lastRun ? formatDate(module.lastRun, "MMM d, yyyy HH:mm") : "—" },
    { label: t("automation.moduleCard.avgDuration"), value: module.averageDuration },
    { label: t("automation.detail.nextScheduledRun"), value: module.nextRun ? formatDate(module.nextRun, "MMM d, yyyy HH:mm") : "—" },
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
