"use client";

import { useState } from "react";
import type { AutomationLog, AutomationLogStatus } from "@/types/automation";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { friendlyAutomationLogMessage } from "@/lib/automationLogMessaging";
import { AutomationLogDetailModal } from "./AutomationLogDetailModal";
import { useTranslation } from "@/i18n/useTranslation";

function logStatusLabel(status: AutomationLogStatus, t: (key: string) => string): string {
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

export function AutomationLogsTable({ logs }: { logs: AutomationLog[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const [detailLog, setDetailLog] = useState<AutomationLog | null>(null);

  function fmtTime(d: string | Date) {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return "—";
    return new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(dt);
  }

  return (
    <>
      <SectionCard
        title={t("automation.logs.recentTitle")}
        description={t("automation.logs.recentDesc")}
        contentClassName="p-0"
      >
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("automation.logs.time")}</TableHead>
                <TableHead>{t("automation.logs.module")}</TableHead>
                <TableHead>{t("automation.logs.status")}</TableHead>
                <TableHead>{t("automation.logs.message")}</TableHead>
                <TableHead>{t("automation.logs.relatedRecord")}</TableHead>
                <TableHead>{t("automation.logs.duration")}</TableHead>
                <TableHead className="text-right">{t("automation.logs.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const displayMessage = friendlyAutomationLogMessage(log.technicalMessage ?? log.message);
                return (
                  <TableRow key={log.id}>
                    <TableCell>{fmtTime(log.createdAt)}</TableCell>
                    <TableCell className="font-medium">{log.moduleName}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "Success" ? "success" : log.status === "Warning" ? "warning" : "danger"}>
                        {logStatusLabel(log.status, t)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">{displayMessage}</TableCell>
                    <TableCell>{log.relatedRecord}</TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" type="button" onClick={() => setDetailLog(log)}>
                        {t("jobs.view")}
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
