"use client";

import type { ComponentType } from "react";
import { AUTOMATION_MODULE_ICONS, BotIcon, EyeIcon, type IconProps } from "@/components/icons";
import type { AutomationModule } from "@/types/automation";
import type { AutomationStatus } from "@/types/automation";
import { timeAgo } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AutomationStatusBadge } from "./AutomationStatusBadge";
import { AutomationCategoryBadge } from "./AutomationCategoryBadge";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/useTranslation";

interface AutomationModuleCardProps {
  module: AutomationModule;
  onView?: (module: AutomationModule) => void;
  onToggle?: (moduleId: string, newStatus: AutomationStatus) => void;
  onConfigure?: (module: AutomationModule) => void;
}

export function AutomationModuleCard({ module, onView, onToggle, onConfigure }: AutomationModuleCardProps) {
  const { t } = useTranslation();
  const canToggle = module.status === "Active" || module.status === "Paused";
  const nextStatus: AutomationStatus = module.status === "Active" ? "Paused" : "Active";
  const Icon: ComponentType<IconProps> = AUTOMATION_MODULE_ICONS[module.icon] ?? BotIcon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="hover-lift">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--surface-3)]">
                <Icon size={16} className="text-[var(--text-2)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-1)]">{module.name}</p>
                <p className="mt-0.5 text-xs text-[var(--text-3)]">{module.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <AutomationStatusBadge status={module.status} />
              <AutomationCategoryBadge category={module.category} />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
              <span>{t("automation.moduleCard.successRate")}</span>
              <span className="font-medium text-[var(--text-2)]">{module.successRate}%</span>
            </div>
            <Progress value={module.successRate} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-3)]">
            <span>
              {t("automation.moduleCard.totalRunsLabel")}: {module.totalRuns}
            </span>
            <span>
              {t("automation.moduleCard.failedRunsLabel")}: {module.failedRuns}
            </span>
            <span>
              {t("automation.moduleCard.avgDuration")}: {module.averageDuration}
            </span>
            <span>
              {t("automation.moduleCard.lastRun")}: {module.lastRun ? timeAgo(module.lastRun) : "—"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onView?.(module)}>
              <EyeIcon size={14} className="mr-1" />
              {t("automation.moduleCard.viewDetails")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onConfigure?.(module)}>
              {t("automation.moduleCard.configure")}
            </Button>
            {canToggle ? (
              <Button size="sm" variant="ghost" onClick={() => onToggle?.(module.id, nextStatus)}>
                {module.status === "Active" ? t("automation.moduleCard.pause") : t("automation.moduleCard.resume")}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
