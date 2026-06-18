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
      <div className="grid gap-3 p-4 md:hidden">
        {logs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("interviews.logs.noLogs")}</p>
        ) : (
          logs.map((log) => (
            <article key={log.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-[var(--text-4)]">{timeFmt.format(new Date(log.time))}</span>
                <Badge variant={log.status === "success" ? "success" : log.status === "warning" ? "warning" : "danger"}>
                  {t(STATUS_KEY[log.status] ?? log.status)}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--text-1)]">{t(MODULE_KEY[log.module] ?? log.module)}</p>
              <p className="mt-1 line-clamp-3 text-sm text-[var(--text-2)]">{log.message}</p>
              <p className="mt-2 text-xs text-[var(--text-4)]">
                {log.relatedInterview} · {log.durationMs} ms
              </p>
            </article>
          ))
        )}
      </div>
      <div className="hidden overflow-x-auto md:block">
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
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                {t("interviews.logs.noLogs")}
              </TableCell>
            </TableRow>
          ) : null}
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
      </div>
    </SectionCard>
  );
}
