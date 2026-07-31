"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AutomationIcon } from "@/components/icons";
import type { AutomationModule } from "@/types/automation";
import { AutomationModuleCard } from "@/components/automation/AutomationModuleCard";
import { AutomationDetailPanel } from "@/components/automation/AutomationDetailPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";

interface AutomationHealthProps {
  modules: AutomationModule[];
  jobsCount: number;
  onImportGmail: () => void;
  importLoading: boolean;
}

const CONFIG_TARGETS: Record<string, string> = {
  "job-intake": "/settings?tab=integrations",
  "email-reply-detection": "/settings?tab=integrations",
  "folder-automation": "/documents",
  "cv-routing": "/documents",
  "research-document": "/settings?tab=integrations&provider=claude",
  "ai-processing": "/settings?tab=integrations&provider=claude",
  "pdf-export": "/documents",
  "daily-digest": "/settings?tab=notifications",
  "weekly-report": "/settings?tab=notifications",
  "interview-scheduling": "/settings?tab=integrations&provider=google-calendar",
  "deadline-alert": "/settings?tab=notifications",
  "follow-up-reminder": "/settings?tab=notifications",
  "offer-tracking": "/settings?tab=integrations",
};

export function AutomationHealth({ modules, jobsCount, onImportGmail, importLoading }: AutomationHealthProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<AutomationModule | null>(null);
  const activeCount  = modules.filter((m) => m.status === "Healthy" || m.status === "Ready").length;
  const notRunCount  = modules.filter((m) => m.status === "Not run yet").length;
  const pausedCount  = modules.filter((m) => m.status === "Paused").length;
  const failedCount  = modules.filter((m) => m.status === "Failed" || m.status === "Needs Setup").length;
  const selectedWithText = useMemo(() => selectedModule, [selectedModule]);

  function configureModule(module: AutomationModule) {
    router.push(CONFIG_TARGETS[module.id] ?? "/automation");
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2">
            <AutomationIcon size={16} className="text-[var(--text-3)]" />
            <h3 className="text-sm font-semibold text-[var(--text-1)]">{t("dashboard.automationHealth.title")}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="success">{activeCount} {t("dashboard.automationHealth.active")}</Badge>
            {notRunCount > 0 && <Badge variant="default">{notRunCount} {t("dashboard.automationHealth.notRunYet")}</Badge>}
            <Badge variant="warning">{pausedCount} {t("dashboard.automationHealth.paused")}</Badge>
            <Badge variant="danger">{failedCount} {t("dashboard.automationHealth.needsAttention")}</Badge>
            <Link href="/automation" className="rounded-md border border-[var(--border-default)] px-2.5 py-1 font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]">
              {t("dashboard.automationHealth.manage")}
            </Link>
          </div>
        </CardContent>
      </Card>

      {jobsCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-1)]">{t("dashboard.emptyJobs.title")}</p>
              <p className="text-sm text-[var(--text-3)]">{t("dashboard.emptyJobs.description")}</p>
            </div>
            <Button type="button" onClick={onImportGmail} disabled={importLoading}>
              {importLoading ? t("dashboard.emptyJobs.importing") : t("dashboard.emptyJobs.importGmail")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <AutomationModuleCard
            key={module.id}
            module={module}
            variant="dashboard"
            onView={setSelectedModule}
            onConfigure={configureModule}
          />
        ))}
      </div>

      <AutomationDetailPanel
        module={selectedWithText}
        open={Boolean(selectedWithText)}
        onClose={() => setSelectedModule(null)}
        onRun={selectedWithText?.id === "job-intake" ? () => onImportGmail() : undefined}
        onConfigure={configureModule}
      />
    </section>
  );
}
