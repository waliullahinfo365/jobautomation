"use client";

import { useState } from "react";
import type { AutomationLog } from "@/types/automation";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AutomationLogDetailModal } from "./AutomationLogDetailModal";
import { useTranslation } from "@/i18n/useTranslation";
import { formatDateShortMonthWithTimeLocale } from "@/lib/format-date-locale";
import {
  formatDashboardAutomationLogMessage,
  formatDashboardAutomationLogModuleName,
} from "@/lib/dashboard-automation-log-messages";
import { friendlyAutomationLogMessage } from "@/lib/automationLogMessaging";

export type AutomationLogsTableVariant = "automation" | "dashboard";

function logStatusLabel(
  status: string,
  t: (key: string) => string,
  variant: AutomationLogsTableVariant
): string {
  if (variant === "dashboard") {
    switch (status) {
      case "Success":
        return t("dashboard.logStatus.success");
      case "Warning":
        return t("dashboard.logStatus.warning");
      case "Failed":
        return t("dashboard.logStatus.failed");
      case "Running":
        return t("dashboard.logStatus.running");
      case "Queued":
        return t("dashboard.logStatus.queued");
      case "Skipped":
        return t("dashboard.logStatus.skipped");
      default:
        return status;
    }
  }
  switch (status) {
    case "Success":
      return t("automation.logStatus.success");
    case "Warning":
      return t("automation.logStatus.warning");
    case "Failed":
      return t("automation.logStatus.failed");
    default:
      return status;
  }
}

export function AutomationLogsTable({
  logs,
  variant = "automation",
}: {
  logs: AutomationLog[];
  variant?: AutomationLogsTableVariant;
}) {
  const { t, locale } = useTranslation();
  const [detailLog, setDetailLog] = useState<AutomationLog | null>(null);
  const isDashboard = variant === "dashboard";
  const titleKey = isDashboard ? "dashboard.logs.recentTitle" : "automation.logs.recentTitle";
  const descKey = isDashboard ? "dashboard.logs.recentDesc" : "automation.logs.recentDesc";
  const timeKey = isDashboard ? "dashboard.logs.time" : "automation.logs.time";
  const moduleKey = isDashboard ? "dashboard.logs.module" : "automation.logs.module";
  const statusKey = isDashboard ? "dashboard.logs.status" : "automation.logs.status";
  const messageKey = isDashboard ? "dashboard.logs.message" : "automation.logs.message";
  const relatedKey = isDashboard ? "dashboard.logs.relatedRecord" : "automation.logs.relatedRecord";
  const durationKey = isDashboard ? "dashboard.logs.duration" : "automation.logs.duration";
  const actionKey = isDashboard ? "dashboard.logs.action" : "automation.logs.action";

  return (
    <>
      <SectionCard title={t(titleKey)} description={t(descKey)} contentClassName="p-0">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t(timeKey)}</TableHead>
                <TableHead>{t(moduleKey)}</TableHead>
                <TableHead>{t(statusKey)}</TableHead>
                <TableHead>{t(messageKey)}</TableHead>
                <TableHead>{t(relatedKey)}</TableHead>
                <TableHead>{t(durationKey)}</TableHead>
                <TableHead className="text-right">{t(actionKey)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const displayMessage = isDashboard
                  ? formatDashboardAutomationLogMessage(log, t)
                  : friendlyAutomationLogMessage(log.technicalMessage ?? log.message);
                const moduleName = isDashboard ? formatDashboardAutomationLogModuleName(log, t) : log.moduleName;
                const timeDisplay = formatDateShortMonthWithTimeLocale(log.createdAt, locale);
                return (
                  <TableRow key={log.id}>
                    <TableCell>{timeDisplay}</TableCell>
                    <TableCell className="font-medium">{moduleName}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "Success" ? "success" : log.status === "Warning" ? "warning" : "danger"}>
                        {logStatusLabel(log.status, t, variant)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">{displayMessage}</TableCell>
                    <TableCell>{log.relatedRecord}</TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" type="button" onClick={() => setDetailLog(log)}>
                        {t(isDashboard ? "dashboard.opportunities.view" : "jobs.view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <AutomationLogDetailModal log={detailLog} open={detailLog !== null} onClose={() => setDetailLog(null)} />
    </>
  );
}
