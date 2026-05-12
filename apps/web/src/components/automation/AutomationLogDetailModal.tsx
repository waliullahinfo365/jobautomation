"use client";

import type { AutomationLog } from "@/types/automation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { friendlyAutomationLogMessage } from "@/lib/automationLogMessaging";
import { useTranslation } from "@/i18n/useTranslation";

type Props = {
  log: AutomationLog | null;
  open: boolean;
  onClose: () => void;
};

export function AutomationLogDetailModal({ log, open, onClose }: Props) {
  const { t } = useTranslation();
  if (!open || !log) return null;

  const friendly = friendlyAutomationLogMessage(log.technicalMessage ?? log.message);
  const raw = log.technicalMessage && log.technicalMessage !== friendly ? log.technicalMessage : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        className="relative z-50 w-full max-w-lg rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-1)]">{t("automation.logDetail.title")}</h2>
            <p className="mt-1 text-xs text-[var(--text-3)]">{formatDate(log.createdAt, "MMM d, yyyy HH:mm")}</p>
          </div>
          <Badge variant={log.status === "Success" ? "success" : log.status === "Warning" ? "warning" : "danger"}>
            {translateLogStatus(log.status, t)}
          </Badge>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-[var(--text-3)]">{t("table.header.module")}</dt>
            <dd className="text-[var(--text-1)]">{log.moduleName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--text-3)]">{t("table.header.message")}</dt>
            <dd className="text-[var(--text-2)]">{friendly}</dd>
          </div>
          {log.error ? (
            <div>
              <dt className="text-xs font-medium text-[var(--text-3)]">{t("automation.logDetail.error")}</dt>
              <dd className="whitespace-pre-wrap break-words text-[var(--rose)]">{log.error}</dd>
            </div>
          ) : null}
          {log.metadata && typeof log.metadata.errorDetails === "object" && log.metadata.errorDetails !== null ? (
            <div>
              <dt className="text-xs font-medium text-[var(--text-3)]">{t("automation.logDetail.errorDetails")}</dt>
              <dd className="mt-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-3)] p-2 font-mono text-xs text-[var(--text-2)]">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(log.metadata.errorDetails, null, 2)}
                </pre>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium text-[var(--text-3)]">{t("table.header.relatedRecord")}</dt>
            <dd className="text-[var(--text-2)]">{log.relatedRecord}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--text-3)]">{t("table.header.duration")}</dt>
            <dd className="text-[var(--text-2)]">{log.duration}</dd>
          </div>
          {log.operationId ? (
            <div>
              <dt className="text-xs font-medium text-[var(--text-3)]">{t("automation.logDetail.operationId")}</dt>
              <dd className="break-all font-mono text-xs text-[var(--text-2)]">{log.operationId}</dd>
            </div>
          ) : null}
          {log.jobId ? (
            <div>
              <dt className="text-xs font-medium text-[var(--text-3)]">{t("automation.logDetail.jobId")}</dt>
              <dd className="break-all font-mono text-xs text-[var(--text-2)]">{log.jobId}</dd>
            </div>
          ) : null}
        </dl>

        {raw ? (
          <details className="mt-4 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-3)] p-3 text-xs">
            <summary className="cursor-pointer font-medium text-[var(--text-2)]">{t("automation.logDetail.technicalDetails")}</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[var(--text-3)]">{raw}</pre>
          </details>
        ) : null}

        {log.metadata && Object.keys(log.metadata).length > 0 ? (
          <details className="mt-3 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-3)] p-3 text-xs">
            <summary className="cursor-pointer font-medium text-[var(--text-2)]">{t("automation.logDetail.rawMetadata")}</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[var(--text-3)]">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </details>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function translateLogStatus(status: AutomationLog["status"], t: (key: string) => string) {
  if (status === "Success") return t("status.success");
  if (status === "Warning") return t("status.warning");
  if (status === "Failed") return t("status.failed");
  return status;
}
