"use client";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import type { InterviewAutomationLog } from "@/types/interview";

const MODULE_KEY: Record<string, string> = {
  "Email Reply Detection": "interviews.automationModule.emailReplyDetection",
  "Interview Scheduling Automation": "interviews.automationModule.interviewSchedulingAutomation",
};

const STATUS_KEY: Record<string, string> = {
  success: "interviews.logStatus.success",
  warning: "interviews.logStatus.warning",
  failed: "interviews.logStatus.failed",
};

export function InterviewAutomationLogs({ logs }: { logs: InterviewAutomationLog[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const timeFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <SectionCard title={t("interviews.logs.title")} description={t("interviews.logs.subtitle")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("interviews.logs.time")}</TableHead>
            <TableHead>{t("interviews.logs.module")}</TableHead>
            <TableHead>{t("interviews.logs.status")}</TableHead>
            <TableHead>{t("interviews.logs.message")}</TableHead>
            <TableHead>{t("interviews.logs.relatedInterview")}</TableHead>
            <TableHead>{t("interviews.logs.duration")}</TableHead>
            <TableHead className="text-right">{t("interviews.logs.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{timeFmt.format(new Date(log.time))}</TableCell>
              <TableCell>{t(MODULE_KEY[log.module] ?? log.module)}</TableCell>
              <TableCell>
                <Badge variant={log.status === "success" ? "success" : log.status === "warning" ? "warning" : "danger"}>
                  {t(STATUS_KEY[log.status] ?? log.status)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[360px] truncate">{log.message}</TableCell>
              <TableCell>{log.relatedInterview}</TableCell>
              <TableCell>{log.durationMs} ms</TableCell>
              <TableCell className="text-right"><Button size="sm" variant="ghost">{t("interviews.logs.view")}</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
