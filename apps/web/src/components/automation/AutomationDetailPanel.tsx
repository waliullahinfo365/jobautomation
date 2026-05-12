"use client";

import { CloseIcon } from "@/components/icons";
import type { AutomationModule } from "@/types/automation";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { AutomationStatusBadge } from "./AutomationStatusBadge";
import { AutomationCategoryBadge } from "./AutomationCategoryBadge";
import { AutomationHealthMetrics } from "./AutomationHealthMetrics";
import { formatDate } from "@/lib/utils";
import { friendlyAutomationLogMessage } from "@/lib/automationLogMessaging";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/i18n/useTranslation";

interface AutomationDetailPanelProps {
  module: AutomationModule | null;
  open: boolean;
  onClose: () => void;
  onRun?: (module: AutomationModule) => void;
  onConfigure?: (module: AutomationModule) => void;
}

export function AutomationDetailPanel({ module, open, onClose, onRun, onConfigure }: AutomationDetailPanelProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && module ? (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card p-6"
          >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-1)]">{module.name}</h2>
            <p className="mt-1 text-sm text-[var(--text-2)]">{module.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <AutomationStatusBadge status={module.status} />
              <AutomationCategoryBadge category={module.category} />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <CloseIcon size={20} />
          </Button>
        </div>

        <div className="space-y-5">
          <SectionCard title={t("automation.detail.healthMetrics")}>
            <AutomationHealthMetrics module={module} />
          </SectionCard>

          <SectionCard title={t("section.triggerInfo")}>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <Info label={t("automation.detail.triggerType")} value={module.triggerType} />
              <Info label={t("automation.detail.triggerSource")} value={module.triggerSource} />
              <Info label={t("automation.detail.schedule")} value={module.schedule} />
              <Info label={t("automation.detail.inputSource")} value={module.inputSource} />
            </div>
          </SectionCard>

          <SectionCard title={t("automation.detail.actionsPerformed")}>
            <div className="space-y-2">
              {module.actions.map((action) => (
                <div key={action.id} className="rounded-lg border border-[var(--border-default)] p-3">
                  <p className="text-sm font-medium text-[var(--text-1)]">{action.title}</p>
                  <p className="text-xs text-[var(--text-3)]">{action.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t("automation.detail.recentLogs")}>
            <div className="space-y-2">
              {module.recentLogs?.length ? (
                module.recentLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-[var(--border-default)] p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <Badge variant={log.status === "Success" ? "success" : log.status === "Warning" ? "warning" : "danger"}>
                        {translateLogStatus(log.status, t)}
                      </Badge>
                      <span className="text-xs text-[var(--text-4)]">{formatDate(log.createdAt, "MMM d, HH:mm")}</span>
                    </div>
                    <p className="text-sm text-[var(--text-2)]">
                      {friendlyAutomationLogMessage(log.technicalMessage ?? log.message)}
                    </p>
                    <p className="text-xs text-[var(--text-3)]">
                      {t("automation.detail.related")}: {log.relatedRecord} • {t("table.header.duration")}: {log.duration}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-3)]">{t("automation.detail.noRecentLogs")}</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title={t("automation.detail.configurationPreview")}>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <Info label={t("integration.connectedAccount")} value={module.configuration.connectedAccount} />
              <Info label={t("automation.detail.environment")} value={module.configuration.environment} />
              <Info label={t("section.retryPolicy")} value={module.configuration.retryPolicy} />
              <Info label={t("section.errorHandling")} value={module.configuration.errorHandling} />
            </div>
          </SectionCard>

          <div className="flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-5">
            <Button type="button" variant="default" onClick={() => module && onRun?.(module)}>
              {t("automation.actions.runNow")}
            </Button>
            <Button type="button" variant="outline" onClick={() => module && onConfigure?.(module)}>
              {t("integrations.configure")}
            </Button>
          </div>
        </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function translateLogStatus(status: string, t: (key: string) => string) {
  if (status === "Success") return t("status.success");
  if (status === "Warning") return t("status.warning");
  if (status === "Failed") return t("status.failed");
  return status;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-medium text-[var(--text-1)]">{value}</p>
    </div>
  );
}
