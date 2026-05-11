"use client";

import Link from "next/link";
import { AutomationIcon } from "@/components/icons";
import type { AutomationModule } from "@/types/automation";
import { DashboardAutomationModuleCard } from "./DashboardAutomationModuleCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";

interface AutomationHealthProps {
  modules: AutomationModule[];
}

export function AutomationHealth({ modules }: AutomationHealthProps) {
  const { t } = useTranslation();
  const activeCount = modules.filter((m) => m.status === "Active").length;
  const pausedCount = modules.filter((m) => m.status === "Paused").length;
  const failedCount = modules.filter((m) => m.status === "Failed" || m.status === "Needs Setup").length;

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2">
            <AutomationIcon size={16} className="text-[var(--text-3)]" />
            <h3 className="text-sm font-semibold text-[var(--text-1)]">{t("dashboard.automationHealth.title")}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="success">
              {activeCount} {t("dashboard.automationHealth.active")}
            </Badge>
            <Badge variant="warning">
              {pausedCount} {t("dashboard.automationHealth.paused")}
            </Badge>
            <Badge variant="danger">
              {failedCount} {t("dashboard.automationHealth.needsAttention")}
            </Badge>
            <Link
              href="/automation"
              className="rounded-md border border-[var(--border-default)] px-2.5 py-1 font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
            >
              {t("dashboard.automationHealth.manage")}
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <DashboardAutomationModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  );
}
