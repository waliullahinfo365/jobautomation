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
  const requiredIntegrations = module?.requiredIntegrations?.map((item) => translateRequirement(item, t)) ?? [];
  const missingRequirements = module?.missingRequirements?.map((item) => translateRequirement(item, t)) ?? [];
  const recommendation = module ? translatedRecommendation(module, missingRequirements, t) : "";
  const moduleTitle = module ? translateModuleField(module.id, "title", module.name, t) : "";
  const moduleDescription = module ? translateModuleField(module.id, "description", module.description, t) : "";
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
            <h2 className="text-xl font-semibold text-[var(--text-1)]">{moduleTitle}</h2>
            <p className="mt-1 text-sm text-[var(--text-2)]">{moduleDescription}</p>
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

          <SectionCard title={t("automation.detail.readiness")}>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-[var(--text-3)]">{t("automation.detail.requiredIntegrations")}</p>
                <p className="font-medium text-[var(--text-1)]">
                  {requiredIntegrations.length ? requiredIntegrations.join(", ") : t("automation.detail.none")}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-3)]">{t("automation.detail.missingRequirements")}</p>
                <p className={module.missingRequirements?.length ? "font-medium text-[var(--amber)]" : "font-medium text-[var(--emerald)]"}>
                  {missingRequirements.length ? missingRequirements.join(", ") : t("automation.detail.none")}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-3)]">{t("automation.detail.recommendedNextStep")}</p>
                <p className="font-medium text-[var(--text-1)]">{recommendation || t("automation.detail.noRecommendation")}</p>
              </div>
              {module.lastError ? (
                <div className="rounded-lg border border-[var(--rose-border)] bg-[var(--rose-bg)] p-3 text-[var(--rose)]">
                  <p className="text-xs font-medium">{t("automation.detail.lastError")}</p>
                  <p className="mt-1 text-sm">{module.lastError}</p>
                </div>
              ) : null}
            </div>
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
              {module.actions.length ? (
                module.actions.map((action) => (
                  <div key={action.id} className="rounded-lg border border-[var(--border-default)] p-3">
                    <p className="text-sm font-medium text-[var(--text-1)]">{action.title}</p>
                    <p className="text-xs text-[var(--text-3)]">{action.detail}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-3)]">{t("automation.detail.actionsAvailableFromBackend")}</p>
              )}
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
            {onRun ? (
              <Button type="button" variant="default" onClick={() => module && onRun(module)}>
                {t("automation.actions.runNow")}
              </Button>
            ) : null}
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

function translateRequirement(value: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    Gmail: "automation.requirements.gmail",
    "Claude or OpenAI": "automation.requirements.aiProvider",
    "Anthropic Claude": "automation.requirements.aiProvider",
    "Google Drive": "automation.requirements.googleDrive",
    "Google Drive and Google Docs scope": "automation.requirements.googleDriveDocs",
    "Google Calendar": "automation.requirements.googleCalendar",
    "Active CV / resume": "automation.requirements.activeCv",
    "Telegram, Slack, Resend, SMTP, or dashboard notifications": "automation.requirements.notificationChannel",
    "Dashboard notifications": "automation.requirements.dashboardNotifications",
  };
  const key = keys[value];
  return key ? t(key) : value;
}

function translatedRecommendation(module: AutomationModule, missingRequirements: string[], t: (key: string) => string) {
  if (module.status === "Needs Setup") {
    return `${t("automation.recommendations.configure")}: ${missingRequirements.join(", ")}.`;
  }
  if (module.status === "Not run yet") return t("automation.recommendations.notRunYet");
  if (module.status === "Failed") return t("automation.recommendations.failed");
  if (module.status === "Warning") return t("automation.recommendations.warning");
  if (module.status === "Healthy") return t("automation.recommendations.healthy");
  return module.recommendedNextStep || t("automation.detail.noRecommendation");
}

function translateModuleField(moduleId: string, field: "title" | "description", fallback: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    "job-intake": "jobIntake",
    "duplicate-protection": "duplicateProtection",
    "folder-automation": "googleDriveFolders",
    "applied-status": "appliedStatus",
    "interview-scheduling": "interviewScheduling",
    "cv-routing": "cvRouting",
    "email-reply-detection": "replyDetection",
    "follow-up-reminder": "followUpReminders",
    "pdf-export": "pdfExport",
    "research-document": "researchDocument",
    "ai-processing": "aiProcessing",
    "network-follow-up": "networkFollowUp",
    "offer-tracking": "offerTracking",
    "deadline-alert": "deadlineAlerts",
    "lifecycle-monitoring": "lifecycleMonitoring",
    "daily-digest": "dailyDigest",
    "weekly-report": "weeklyReport",
  };
  const key = keys[moduleId];
  if (!key) return fallback;
  const translated = t(`dashboard.automationModules.${key}.${field}`);
  return translated.includes(`dashboard.automationModules.${key}`) ? fallback : translated;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-medium text-[var(--text-1)]">{value}</p>
    </div>
  );
}
