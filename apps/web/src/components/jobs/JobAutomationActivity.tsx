"use client";

import { useMemo, useState } from "react";
import type { JobAutomationLog } from "@/types/job";
import type { AutomationLog } from "@/types/automation";
import { SectionCard } from "@/components/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { normalizeAutomationLogForUi } from "@/lib/utils/resource";
import { AutomationLogDetailModal } from "@/components/automation/AutomationLogDetailModal";
import { useTranslation } from "@/i18n/useTranslation";

interface JobAutomationActivityProps {
  logs: JobAutomationLog[];
}

const toneMap: Record<JobAutomationLog["status"], "success" | "warning" | "danger"> = {
  success: "success",
  warning: "warning",
  error: "danger",
};

function toDetailModalLog(row: JobAutomationLog): AutomationLog | null {
  if (row.raw && Object.keys(row.raw).length > 0) {
    return normalizeAutomationLogForUi(row.raw);
  }
  return {
    id: row.id,
    _id: row.id,
    moduleId: row.moduleKey ?? "job",
    moduleName: row.event,
    status: row.status === "success" ? "Success" : row.status === "warning" ? "Warning" : "Failed",
    message: row.detail,
    relatedRecord: "—",
    duration: "—",
    createdAt: row.timestamp,
    technicalMessage: row.detail,
    error: row.error,
  };
}

export function JobAutomationActivity({ logs }: JobAutomationActivityProps) {
  const { t } = useTranslation();
  const [openLog, setOpenLog] = useState<AutomationLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const latest = useMemo(() => logs.slice(0, 5), [logs]);

  return (
    <>
      <SectionCard title={t("section.automationActivity")}>
        {latest.length === 0 ? (
          <p className="text-sm text-[var(--text-3)]">{t("jobs.automation.noRuns")}</p>
        ) : (
          <div className="space-y-2">
            {latest.map((log) => (
              <div key={log.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--text-1)]">{log.event}</p>
                  <Badge variant={toneMap[log.status]}>{t(`status.${log.status === "error" ? "failed" : log.status}`)}</Badge>
                </div>
                <p className="line-clamp-2 text-xs text-[var(--text-3)]">{log.detail}</p>
                {log.error ? (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--rose)]" title={log.error}>
                    {log.error}
                  </p>
                ) : null}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-[var(--text-4)]">{formatDate(log.timestamp, "MMM d, yyyy HH:mm")}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      const full = toDetailModalLog(log);
                      if (full) {
                        setOpenLog(full);
                        setModalOpen(true);
                      }
                    }}
                  >
                    {t("common.view")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <AutomationLogDetailModal log={openLog} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
