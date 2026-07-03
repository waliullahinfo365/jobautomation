"use client";

import { useMemo } from "react";
import { useAutomationApi } from "@/hooks/api/useAutomationApi";
import { useIntegrationsApi } from "@/hooks/api/useIntegrationsApi";
import { useAiApi } from "@/hooks/api/useAiApi";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { getSystemStatus, type SystemStatusResponse } from "@/lib/api/system.api";
import { getTodaySummary } from "@/lib/api/today.api";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import {
  mergeAutomationModuleWithMockCatalog,
  normalizeAutomationLogsForUi,
  normalizeAutomationModulesForUi,
  resolveAutomationBackendModuleKey,
} from "@/lib/utils/resource";
import type { AutomationLog, AutomationModule, AutomationStatus } from "@/types/automation";
import type { IntegrationListItem } from "@/types/integrations";

export interface SuperAdminKpis {
  activeUsers: number | null;
  activeUsersHint: string;
  jobsProcessedToday: number;
  automationSuccessRate: number;
  aiCreditsUsed: number | null;
  needsAttention: number;
}

export interface SuperAdminModuleSlot {
  slotId: string;
  labelKey: string;
  module: AutomationModule | null;
  placeholderStatus: AutomationStatus;
  placeholderDescriptionKey: string;
}

export interface SuperAdminAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  titleKey: string;
  message: string;
  href?: string;
}

const MODULE_SLOTS: Array<{ slotId: string; labelKey: string; keys: string[]; placeholderDescriptionKey: string }> = [
  { slotId: "job-intake", labelKey: "superAdmin.modules.jobIntake", keys: ["job-intake", "job-intake-engine"], placeholderDescriptionKey: "superAdmin.modules.jobIntakeDesc" },
  { slotId: "duplicate-protection", labelKey: "superAdmin.modules.duplicateProtection", keys: ["duplicate-protection", "duplicate-protection-engine"], placeholderDescriptionKey: "superAdmin.modules.duplicateProtectionDesc" },
  { slotId: "folder-automation", labelKey: "superAdmin.modules.googleDriveFolders", keys: ["folder-automation", "folder-subfolder-automation", "google-drive-folders"], placeholderDescriptionKey: "superAdmin.modules.googleDriveFoldersDesc" },
  { slotId: "apply-assistant", labelKey: "superAdmin.modules.applyAssistant", keys: ["apply-assistant", "manual-apply", "apply-assistant-engine"], placeholderDescriptionKey: "superAdmin.modules.applyAssistantDesc" },
  { slotId: "cv-routing", labelKey: "superAdmin.modules.cvRouting", keys: ["cv-routing", "cv-file-routing", "cv-file-routing-automation"], placeholderDescriptionKey: "superAdmin.modules.cvRoutingDesc" },
  { slotId: "reply-detection", labelKey: "superAdmin.modules.replyDetection", keys: ["email-reply-detection", "reply-detection"], placeholderDescriptionKey: "superAdmin.modules.replyDetectionDesc" },
  { slotId: "follow-up-reminder", labelKey: "superAdmin.modules.followUpReminders", keys: ["follow-up-reminder", "follow-up-reminder-engine", "follow-up-reminders"], placeholderDescriptionKey: "superAdmin.modules.followUpRemindersDesc" },
  { slotId: "ai-processing", labelKey: "superAdmin.modules.aiProcessing", keys: ["ai-processing", "ai-processing-engine"], placeholderDescriptionKey: "superAdmin.modules.aiProcessingDesc" },
  { slotId: "reports", labelKey: "superAdmin.modules.reports", keys: ["weekly-report", "weekly-performance-report", "daily-digest", "daily-status-digest"], placeholderDescriptionKey: "superAdmin.modules.reportsDesc" },
  { slotId: "billing-health", labelKey: "superAdmin.modules.billingHealth", keys: ["billing-health", "billing"], placeholderDescriptionKey: "superAdmin.modules.billingHealthDesc" },
];

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-");
}

function isToday(iso: string | Date): boolean {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function findModuleForSlot(modules: AutomationModule[], keys: string[]): AutomationModule | null {
  const normalizedKeys = new Set(keys.map(normalizeKey));
  return (
    modules.find((module) => {
      const candidates = [module.id, module.key, module.moduleKey, resolveAutomationBackendModuleKey(module.id)]
        .filter(Boolean)
        .map((v) => normalizeKey(String(v)));
      return candidates.some((c) => normalizedKeys.has(c) || [...normalizedKeys].some((k) => c.includes(k)));
    }) ?? null
  );
}

function placeholderStatusForSlot(slotId: string, system?: SystemStatusResponse): AutomationStatus {
  if (slotId === "billing-health") {
    const status = system?.billing?.billingStatus?.toLowerCase() ?? "";
    if (status === "active" || status === "trialing") return "Healthy";
    if (status === "past due" || status === "cancelled") return "Warning";
    return "Needs Setup";
  }
  if (slotId === "apply-assistant") return "Active";
  return "Not run yet";
}

export function useSuperAdminDashboard() {
  const systemQuery = useApiQuery(() => getSystemStatus(), { enabled: true });
  const todayQuery = useApiQuery(() => getTodaySummary(), { enabled: true });
  const automationApi = useAutomationApi({ fallbackToMock: false, params: { limit: 80 } });
  const integrationsApi = useIntegrationsApi({ fallbackToMock: false });
  const aiApi = useAiApi();

  const system = systemQuery.data as SystemStatusResponse | undefined;
  const modules = useMemo(() => {
    const raw = normalizeAutomationModulesForUi(normalizeListResponse<unknown>(automationApi.modulesQuery.data));
    return raw.map((m) => mergeAutomationModuleWithMockCatalog(m));
  }, [automationApi.modulesQuery.data]);

  const logs = useMemo(
    () => normalizeAutomationLogsForUi(normalizeListResponse<unknown>(automationApi.logsQuery.data)),
    [automationApi.logsQuery.data]
  );

  const integrations = (integrationsApi.integrations ?? []) as IntegrationListItem[];

  const kpis = useMemo((): SuperAdminKpis => {
    const jobsProcessedToday = logs.filter((log) => isToday(log.createdAt)).length;
    const avgSuccess =
      modules.length > 0
        ? Math.round(modules.reduce((sum, m) => sum + (m.successRate ?? 0), 0) / modules.length)
        : 0;
    const integrationAttention = integrationsApi.health?.needsAttention ?? system?.integrationHealth?.needsAttention ?? 0;
    const failedModules = modules.filter((m) => m.status === "Failed").length;
    const failedLogs = system?.failedLogsLast24h ?? logs.filter((l) => l.status === "Failed" && isToday(l.createdAt)).length;

    const usage = aiApi.usage as { entries?: number; totalInputTokens?: number; totalOutputTokens?: number } | undefined;
    const aiCreditsUsed =
      typeof usage?.entries === "number"
        ? usage.entries
        : typeof usage?.totalInputTokens === "number"
          ? Math.round((usage.totalInputTokens + (usage.totalOutputTokens ?? 0)) / 1000)
          : null;

    return {
      activeUsers: null,
      activeUsersHint: "platformMetric",
      jobsProcessedToday: jobsProcessedToday || todayQuery.data?.jobsToReviewToday || 0,
      automationSuccessRate: avgSuccess,
      aiCreditsUsed,
      needsAttention: integrationAttention + failedModules + failedLogs,
    };
  }, [logs, modules, integrationsApi.health, system, aiApi.usage, todayQuery.data]);

  const moduleSlots = useMemo((): SuperAdminModuleSlot[] => {
    return MODULE_SLOTS.map((slot) => ({
      slotId: slot.slotId,
      labelKey: slot.labelKey,
      module: findModuleForSlot(modules, slot.keys),
      placeholderStatus: placeholderStatusForSlot(slot.slotId, system),
      placeholderDescriptionKey: slot.placeholderDescriptionKey,
    }));
  }, [modules, system]);

  const alerts = useMemo((): SuperAdminAlert[] => {
    const items: SuperAdminAlert[] = [];

    for (const log of system?.recentFailedLogs ?? []) {
      items.push({
        id: `failed-${log.id}`,
        severity: "critical",
        titleKey: "superAdmin.alerts.automationFailed",
        message: log.message || log.error || log.moduleName,
        href: "/automation",
      });
    }

    for (const integration of integrations.filter((i) => i.status === "Needs Attention" || i.status === "Expired")) {
      items.push({
        id: `integration-${integration.slug}`,
        severity: "warning",
        titleKey: "superAdmin.alerts.integrationAttention",
        message: `${integration.provider}: ${integration.errorMessage ?? integration.status}`,
        href: "/settings?section=Integrations",
      });
    }

    if ((system?.integrationHealth?.notConnected ?? 0) > 2) {
      items.push({
        id: "integrations-missing",
        severity: "info",
        titleKey: "superAdmin.alerts.integrationsMissing",
        message: String(system?.integrationHealth?.notConnected ?? 0),
        href: "/settings?section=Integrations",
      });
    }

    if (system?.billing?.billingStatus && !["Active", "Trialing"].includes(system.billing.billingStatus)) {
      items.push({
        id: "billing-status",
        severity: "warning",
        titleKey: "superAdmin.alerts.billingStatus",
        message: `${system.billing.displayName} · ${system.billing.billingStatus}`,
        href: "/settings?section=Billing",
      });
    }

    return items.slice(0, 8);
  }, [system, integrations]);

  const recentLogs = useMemo(() => logs.slice(0, 12), [logs]);

  const connectedIntegrations = useMemo(
    () =>
      integrations.filter((i) =>
        ["gmail", "google-drive", "google-calendar", "linkedin", "claude", "resend", "telegram", "smtp"].includes(i.slug)
      ),
    [integrations]
  );

  const loading =
    systemQuery.loading ||
    automationApi.loading ||
    integrationsApi.integrationsLoading ||
    aiApi.usageLoading;

  const refetch = async () => {
    await Promise.all([
      systemQuery.refetch(),
      todayQuery.refetch(),
      automationApi.refetch(),
      integrationsApi.refetch(),
      aiApi.refetchUsage(),
    ]);
  };

  return {
    loading,
    kpis,
    moduleSlots,
    alerts,
    recentLogs,
    connectedIntegrations,
    integrationHealth: system?.integrationHealth ?? integrationsApi.health,
    system,
    refetch,
    isUsingFallback: automationApi.isUsingFallback || integrationsApi.isUsingFallback,
  };
}
