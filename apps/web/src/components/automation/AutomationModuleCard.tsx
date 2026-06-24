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
  variant?: "default" | "dashboard";
  onView?: (module: AutomationModule) => void;
  onToggle?: (moduleId: string, newStatus: AutomationStatus) => void;
  onConfigure?: (module: AutomationModule) => void;
}

const AUTOMATION_MODULE_TRANSLATION_KEYS: Record<string, string> = {
  "job-intake": "jobIntake",
  "job-intake-engine": "jobIntake",
  "duplicate-protection": "duplicateProtection",
  "duplicate-protection-engine": "duplicateProtection",
  "research-document": "researchDocument",
  "research-stage-document-generation": "researchDocument",
  "ai-processing": "aiProcessing",
  "ai-processing-engine": "aiProcessing",
  "folder-automation": "googleDriveFolders",
  "folder-subfolder-automation": "googleDriveFolders",
  "google-drive-folders": "googleDriveFolders",
  "cv-routing": "cvRouting",
  "cv-file-routing": "cvRouting",
  "cv-file-routing-automation": "cvRouting",
  "interview-scheduling": "interviewScheduling",
  "interview-scheduling-automation": "interviewScheduling",
  "email-reply-detection": "replyDetection",
  "reply-detection": "replyDetection",
  "follow-up-reminder": "followUpReminders",
  "follow-up-reminder-engine": "followUpReminders",
  "follow-up-reminders": "followUpReminders",
  "deadline-alert": "deadlineAlerts",
  "deadline-alert-system": "deadlineAlerts",
  "deadline-alerts": "deadlineAlerts",
  "lifecycle-monitoring": "lifecycleMonitoring",
  "daily-digest": "dailyDigest",
  "daily-status-digest": "dailyDigest",
  "weekly-report": "weeklyReport",
  "weekly-performance-report": "weeklyReport",
  "pdf-export": "pdfExport",
  "document-pdf-export-automation": "pdfExport",
  "offer-tracking": "offerTracking",
  "offer-tracking-automation": "offerTracking",
  "network-follow-up": "networkFollowUp",
  "network-follow-up-automation": "networkFollowUp",
  "applied-status": "appliedStatus",
  "applied-status-automation": "appliedStatus",
};

function normalizeAutomationModuleKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getAutomationModuleText(module: AutomationModule, t: (key: string) => string) {
  const source = module as AutomationModule & {
    key?: string;
    slug?: string;
    module?: string;
    label?: string;
  };
  const candidates = [
    source.key,
    module.id,
    source.slug,
    source.module,
    module.name,
  ].map(normalizeAutomationModuleKey);

  const translationKey = candidates
    .map((candidate) => AUTOMATION_MODULE_TRANSLATION_KEYS[candidate])
    .find(Boolean);

  if (!translationKey) {
    return {
      title: module.name || source.label || t("dashboard.automationHealth.fallbackTitle"),
      description: module.description || t("dashboard.automationHealth.fallbackDescription"),
    };
  }

  const titleKey = `dashboard.automationModules.${translationKey}.title`;
  const descriptionKey = `dashboard.automationModules.${translationKey}.description`;
  const title = t(titleKey);
  const description = t(descriptionKey);

  return {
    title: title === titleKey ? module.name || source.label || t("dashboard.automationHealth.fallbackTitle") : title,
    description:
      description === descriptionKey
        ? module.description || t("dashboard.automationHealth.fallbackDescription")
        : description,
  };
}

export function AutomationModuleCard({ module, variant = "default", onView, onToggle, onConfigure }: AutomationModuleCardProps) {
  const { t, locale } = useTranslation();
  const canToggle = module.status === "Active" || module.status === "Paused";
  const nextStatus: AutomationStatus = module.status === "Active" ? "Paused" : "Active";
  const Icon: ComponentType<IconProps> = AUTOMATION_MODULE_ICONS[module.icon] ?? BotIcon;

  const isDash = variant === "dashboard";
  const dashboardText = getAutomationModuleText(module, t);
  const displayName = isDash ? dashboardText.title : module.name;
  const displayDesc = isDash ? dashboardText.description : module.description;
  const bcp47 = locale === "de" ? "de-DE" : "en-US";

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
                <p className="text-sm font-semibold text-[var(--text-1)]">{displayName}</p>
                <p className="mt-0.5 text-xs text-[var(--text-3)]">{displayDesc}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <AutomationStatusBadge status={module.status} />
              <AutomationCategoryBadge category={module.category} />
            </div>
          </div>

          {module.totalRuns > 0 ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
                <span>{isDash ? t("dashboard.automationHealth.successRate") : t("automation.moduleCard.successRate")}</span>
                <span className="font-medium text-[var(--text-2)]">{module.successRate}%</span>
              </div>
              <Progress value={module.successRate} />
            </div>
          ) : (
            <div className="mt-4 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 text-xs text-[var(--text-3)]">
              {t("dashboard.automationHealth.noRunsHint")}
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[var(--text-3)] sm:grid-cols-2">
            <span>
              {isDash ? t("dashboard.automationHealth.totalRuns") : t("automation.moduleCard.totalRunsLabel")}: {module.totalRuns}
            </span>
            <span>
              {isDash ? t("dashboard.automationHealth.failures") : t("automation.moduleCard.failedRunsLabel")}: {module.failedRuns}
            </span>
            <span>
              {isDash ? t("dashboard.automationHealth.avgDuration") : t("automation.moduleCard.avgDuration")}: {module.averageDuration}
            </span>
            <span>
              {isDash ? t("dashboard.automationHealth.lastRun") : t("automation.moduleCard.lastRun")}:{" "}
              {module.lastRun
                ? isDash
                  ? new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(module.lastRun))
                  : timeAgo(module.lastRun)
                : "—"}
            </span>
          </div>

          {module.missingRequirements?.length ? (
            <div className="mt-3 rounded-[var(--r-md)] border border-[var(--amber-border)] bg-[var(--amber-bg)] p-3 text-xs text-[var(--amber)]">
              <span className="font-medium">{t("dashboard.automationHealth.missingSetup")}:</span>{" "}
              {module.missingRequirements.map((item) => translateRequirement(item, t)).join(", ")}
            </div>
          ) : null}

          <div className="mt-4 mobile-card-actions mobile-card-actions--row-sm">
            <Button size="sm" variant="outline" className="min-h-[44px] sm:w-auto" onClick={() => onView?.(module)}>
              <EyeIcon size={14} className="mr-1" />
              {isDash ? t("dashboard.automationHealth.details") : t("automation.moduleCard.viewDetails")}
            </Button>
            <Button size="sm" variant="secondary" className="min-h-[44px] sm:w-auto" onClick={() => onConfigure?.(module)}>
              {isDash ? t("dashboard.automationHealth.configure") : t("automation.moduleCard.configure")}
            </Button>
            {canToggle ? (
              <Button size="sm" variant="ghost" className="min-h-[44px] sm:w-auto" onClick={() => onToggle?.(module.id, nextStatus)}>
                {module.status === "Active" ? t("automation.moduleCard.pause") : t("automation.moduleCard.resume")}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
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
