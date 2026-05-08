"use client";

import {
  AlertTriangleIcon,
  BotIcon,
  CheckCircleIcon,
  GaugeIcon,
  PlayCircleIcon,
  WrenchIcon,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";

interface AutomationStatsCardsProps {
  stats: {
    totalAutomations: number;
    activeModules: number;
    failedModules: number;
    needsSetup: number;
    runsToday: number;
    averageSuccessRate: number;
  };
}

function StatCard({ label, value, helper, icon }: { label: string; value: string | number; helper: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--text-3)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-1)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-3)]">{helper}</p>
          </div>
          <div className="rounded-lg bg-[var(--accent-bg)] p-2.5 text-[var(--accent-hi)]">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AutomationStatsCards({ stats }: AutomationStatsCardsProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard
        label={t("automation.stats.totalAutomations")}
        value={stats.totalAutomations}
        helper={t("automation.stats.totalAutomationsHelper")}
        icon={<BotIcon size={20} />}
      />
      <StatCard
        label={t("automation.stats.activeModules")}
        value={stats.activeModules}
        helper={t("automation.stats.activeModulesHelper")}
        icon={<CheckCircleIcon size={20} />}
      />
      <StatCard
        label={t("automation.stats.failedModules")}
        value={stats.failedModules}
        helper={t("automation.stats.failedModulesHelper")}
        icon={<AlertTriangleIcon size={20} />}
      />
      <StatCard
        label={t("automation.stats.needsSetup")}
        value={stats.needsSetup}
        helper={t("automation.stats.needsSetupHelper")}
        icon={<WrenchIcon size={20} />}
      />
      <StatCard
        label={t("automation.stats.runsToday")}
        value={stats.runsToday}
        helper={t("automation.stats.runsTodayHelper")}
        icon={<PlayCircleIcon size={20} />}
      />
      <StatCard
        label={t("automation.stats.averageSuccessRate")}
        value={`${stats.averageSuccessRate}%`}
        helper={t("automation.stats.averageSuccessRateHelper")}
        icon={<GaugeIcon size={20} />}
      />
    </div>
  );
}
