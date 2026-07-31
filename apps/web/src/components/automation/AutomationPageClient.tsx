"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AutomationIcon, RefreshIcon, SettingsIcon } from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { AutomationStatsCards } from "./AutomationStatsCards";
import { AutomationTabs, type AutomationTab } from "./AutomationTabs";
import { AutomationFilters, type AutomationFilterState } from "./AutomationFilters";
import { AutomationModulesGrid } from "./AutomationModulesGrid";
import { AutomationDetailPanel } from "./AutomationDetailPanel";
import { AutomationLogsTable } from "./AutomationLogsTable";
import { ConfigureAutomationModal } from "./ConfigureAutomationModal";
import { useAutomationApi } from "@/hooks/api/useAutomationApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import {
  automationUiStatusToBackend,
  mergeAutomationModuleWithMockCatalog,
  mapAutomationStatusBackendToUi,
  normalizeAutomationLogsForUi,
  normalizeAutomationModulesForUi,
  resolveAutomationBackendModuleKey,
} from "@/lib/utils/resource";
import type { AutomationModule, AutomationStatus } from "@/types/automation";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { isGoogleDriveEnabled } from "@/lib/feature-flags";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";

const initialFilters: AutomationFilterState = {
  query: "",
  status: "All",
  category: "All",
};

export function AutomationPageClient() {
  const { t } = useTranslation();
  const automationApi = useAutomationApi({ fallbackToMock: false });

  const [localModuleOverrides, setLocalModuleOverrides] = useState<Record<string, Partial<AutomationModule>>>({});
  const [selectedModule, setSelectedModule] = useState<AutomationModule | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AutomationTab>("All");
  const [filters, setFilters] = useState<AutomationFilterState>(initialFilters);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [configureModuleId, setConfigureModuleId] = useState<string | null>(null);
  const [adminResetToken, setAdminResetToken] = useState("");
  const [lastAdminResult, setLastAdminResult] = useState<string>("");

  const logRows = useMemo(
    () => normalizeAutomationLogsForUi(normalizeListResponse<unknown>(automationApi.logsQuery.data)),
    [automationApi.logsQuery.data]
  );

  const baseModules = useMemo(() => {
    const raw = normalizeAutomationModulesForUi(normalizeListResponse<unknown>(automationApi.modulesQuery.data));
    return raw.map((m) => mergeAutomationModuleWithMockCatalog(m));
  }, [automationApi.modulesQuery.data]);

  const modules = useMemo(() => {
    return baseModules.map((m) => ({ ...m, ...localModuleOverrides[m.id] }));
  }, [baseModules, localModuleOverrides]);

  const modulesWithLogs = useMemo(() => {
    return modules.map((m) => ({
      ...m,
      recentLogs: logRows
        .filter((l) => l.moduleId === resolveAutomationBackendModuleKey(m.id))
        .slice(0, 8),
    }));
  }, [modules, logRows]);

  const stats = useMemo(() => {
    const totalRuns = modulesWithLogs.reduce((sum, m) => sum + m.totalRuns, 0);
    const avgSuccessRate = modulesWithLogs.length
      ? Math.round(modulesWithLogs.reduce((sum, m) => sum + m.successRate, 0) / modulesWithLogs.length)
      : 0;
    return {
      totalAutomations: modulesWithLogs.length,
      activeModules: modulesWithLogs.filter((m) => m.status === "Active").length,
      failedModules: modulesWithLogs.filter((m) => m.status === "Failed").length,
      needsSetup: modulesWithLogs.filter((m) => m.status === "Needs Setup").length,
      runsToday: totalRuns,
      averageSuccessRate: avgSuccessRate,
    };
  }, [modulesWithLogs]);

  const filteredModules = useMemo(() => {
    const hideDriveModules = !isGoogleDriveEnabled();
    return modulesWithLogs.filter((module) => {
      const key = resolveAutomationBackendModuleKey(module.id);
      if (hideDriveModules && (key === "folder-automation" || key === "cv-routing")) {
        return false;
      }
      const matchesTab = activeTab === "All" ? true : module.status === activeTab;
      const matchesQuery =
        !filters.query ||
        `${module.name} ${module.description}`.toLowerCase().includes(filters.query.toLowerCase());
      const matchesStatus = filters.status === "All" ? true : module.status === filters.status;
      const matchesCategory = filters.category === "All" ? true : module.category === filters.category;
      return matchesTab && matchesQuery && matchesStatus && matchesCategory;
    });
  }, [modulesWithLogs, activeTab, filters]);

  const handleViewDetails = useCallback((module: AutomationModule) => {
    setSelectedModule(module);
    setPanelOpen(true);
  }, []);

  useEffect(() => {
    if (!selectedModule || !panelOpen) return;
    const next = modulesWithLogs.find((m) => m.id === selectedModule.id);
    if (next) setSelectedModule(next);
  }, [modulesWithLogs, panelOpen, selectedModule?.id]);

  const openConfigure = useCallback((mod?: AutomationModule) => {
    setConfigureModuleId(mod?.id ?? null);
    setConfigureOpen(true);
  }, []);

  const handleSaveConfigure = useCallback(
    async (moduleKey: string, payload: Record<string, unknown>) => {
      const key = resolveAutomationBackendModuleKey(moduleKey);
      if (automationApi.isUsingFallback) {
        setLocalModuleOverrides((prev) => ({
          ...prev,
          [moduleKey]: {
            ...prev[moduleKey],
            status: mapAutomationStatusBackendToUi(String(payload.status ?? "Warning")),
            schedule: typeof payload.schedule === "string" ? payload.schedule : undefined,
            triggerType: typeof payload.triggerType === "string" ? payload.triggerType : undefined,
            description: typeof payload.description === "string" ? payload.description : undefined,
          },
        }));
        showInfo(t("automation.toast.offlineLocalUpdate"));
        setConfigureOpen(false);
        return;
      }
      try {
        await automationApi.updateAutomationModule({ moduleKey: key, payload });
        showSuccess(t("automation.toast.configSaved"));
        setConfigureOpen(false);
        await automationApi.refetch();
      } catch {
        showError(t("automation.toast.saveConfigFailed"));
      }
    },
    [automationApi, t]
  );

  const handleToggleStatus = useCallback(
    async (moduleId: string, nextStatus: AutomationStatus) => {
      const mod = modulesWithLogs.find((m) => m.id === moduleId);
      if (!mod) return;

      if (automationApi.isUsingFallback) {
        setLocalModuleOverrides((prev) => ({
          ...prev,
          [moduleId]: { ...prev[moduleId], status: nextStatus },
        }));
        showInfo(t("automation.toast.offlineLocalUpdate"));
        return;
      }

      try {
        await automationApi.updateAutomationModule({
          moduleKey: resolveAutomationBackendModuleKey(moduleId),
          payload: { status: automationUiStatusToBackend(nextStatus) },
        });
        showSuccess(t("automation.toast.statusUpdated"));
        await automationApi.refetch();
      } catch {
        showError(t("automation.toast.updateFailed"));
      }
    },
    [automationApi, modulesWithLogs, t]
  );

  const handleRunModule = useCallback(
    async (module: AutomationModule) => {
      const moduleKey = resolveAutomationBackendModuleKey(module.id);
      const payload: Record<string, unknown> = {};

      if (automationApi.isUsingFallback) {
        showInfo(t("automation.toast.offlineRunHint"));
        return;
      }

      try {
        const res = await automationApi.runAutomationModule({ moduleKey, payload, execute: false });
        const r = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
        const status = String(r.status ?? "").toLowerCase();
        const message = String(r.message ?? "").toLowerCase();
        if (status === "completed" || status === "success") {
          showSuccess(t("automation.toast.completed"));
        } else if (
          status.includes("queued") ||
          status.includes("pending") ||
          message.includes("queue") ||
          message.includes("facade")
        ) {
          showInfo(t("automation.toast.queuedDemo"));
        } else if (status === "warning" || message.includes("warn")) {
          showInfo(t("automation.toast.queuedWarning"));
        } else {
          showSuccess(
            `${t("automation.toast.queuedPartial")}${r.operationId ? ` (${String(r.operationId).slice(0, 12)}…)` : "."}`
          );
        }
        await automationApi.refetch();
      } catch {
        showError(t("automation.toast.queueFailed"));
      }
    },
    [automationApi, t]
  );

  const runReset = useCallback(
    async (dryRun: boolean) => {
      if (!adminResetToken.trim()) {
        showError("Enter ADMIN_RESET_TOKEN first.");
        return;
      }
      try {
        const result = await automationApi.resetOperationalData({
          dryRun,
          adminResetToken: adminResetToken.trim(),
          reason: dryRun ? "client test dry run" : "client test reset",
        });
        automationApi.clearApiCache();
        setLastAdminResult(JSON.stringify(result, null, 2).slice(0, 2200));
        showSuccess(dryRun ? "Reset dry run completed." : "Operational data reset completed.");
        await automationApi.refetch();
      } catch (error) {
        showError(error instanceof Error ? error.message : "Reset failed.");
      }
    },
    [adminResetToken, automationApi],
  );

  const runBackfill = useCallback(
    async (dryRun: boolean) => {
      try {
        const result = await automationApi.backfillJobIntake({
          label: "job alerts",
          days: 7,
          dryRun,
          enqueueDownstream: true,
        });
        automationApi.clearApiCache();
        setLastAdminResult(JSON.stringify(result, null, 2).slice(0, 2200));
        showSuccess(dryRun ? "Email intake dry run completed." : "Email intake started.");
        await automationApi.refetch();
      } catch (error) {
        showError(error instanceof Error ? error.message : "Email intake failed.");
      }
    },
    [automationApi],
  );

  const loadDebugCounts = useCallback(async () => {
    if (!adminResetToken.trim()) {
      showError("Enter ADMIN_RESET_TOKEN first.");
      return;
    }
    try {
      const result = await automationApi.getDebugDataCounts({ adminResetToken: adminResetToken.trim() });
      setLastAdminResult(JSON.stringify(result, null, 2).slice(0, 2200));
      showSuccess("Production data counts loaded.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not load data counts.");
    }
  }, [adminResetToken, automationApi]);

  const initialModulesLoading =
    automationApi.modulesQuery.loading && automationApi.modulesQuery.data === undefined;

  if (initialModulesLoading) {
    return (
      <LoadingState
        title={t("automation.loadingTitle")}
        description={t("automation.loadingDesc")}
        className="min-h-[40vh]"
      />
    );
  }

  if (
    automationApi.error &&
    automationApi.modulesQuery.data === undefined &&
    !automationApi.isUsingFallback
  ) {
    return (
      <ErrorState
        title={t("automation.errorUnavailable")}
        message={automationApi.error.message}
        actionLabel={t("common.tryAgain")}
        onAction={() => void automationApi.refetch()}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          icon={AutomationIcon}
          eyebrow={t("automation.eyebrow")}
          title={t("automation.centerTitle")}
          description={t("automation.centerDescription")}
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              {automationApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={automationApi.loading}
                onClick={() => void automationApi.refetch()}
              >
                <RefreshIcon size={16} className="mr-1" />
                {t("automation.refresh")}
              </Button>
              <Button type="button" onClick={() => openConfigure()}>
                <SettingsIcon size={16} className="mr-2" />
                {t("automation.configure")}
              </Button>
            </div>
          }
        />

        <AutomationStatsCards stats={stats} />

        <div className="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-1)]">Client Test Admin Controls</h2>
              <p className="mt-1 max-w-3xl text-xs text-[var(--text-3)]">
                Reset only operational data, preserve users/integrations/templates, then backfill email job alerts for the last 7 days.
              </p>
            </div>
            <input
              type="password"
              value={adminResetToken}
              onChange={(e) => setAdminResetToken(e.target.value)}
              placeholder="ADMIN_RESET_TOKEN"
              className="min-h-[38px] rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-1)] outline-none"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={automationApi.mutations.resetLoading} onClick={() => void runReset(true)}>
              Dry run reset
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={automationApi.mutations.resetLoading} onClick={() => void runReset(false)}>
              Reset operational data
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={automationApi.mutations.backfillLoading} onClick={() => void runBackfill(true)}>
              Dry run email intake
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={automationApi.mutations.debugCountsLoading} onClick={() => void loadDebugCounts()}>
              Show data counts
            </Button>
            <Button type="button" size="sm" disabled={automationApi.mutations.backfillLoading} onClick={() => void runBackfill(false)}>
              Backfill last 7 days
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={automationApi.mutations.backfillLoading} onClick={() => void runBackfill(false)}>
              Run email intake now
            </Button>
          </div>
          {lastAdminResult ? (
            <pre className="mt-4 max-h-72 overflow-auto rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-xs text-[var(--text-2)]">
              {lastAdminResult}
            </pre>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AutomationTabs value={activeTab} onChange={setActiveTab} />
          <p className="text-xs text-[var(--text-3)]">
            {t("automation.filterHint")}
            {automationApi.isUsingFallback ? t("automation.filterHintSuffixDemo") : t("automation.filterHintSuffixLive")}
          </p>
        </div>

        <AutomationFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(initialFilters)}
          aside={automationApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
        />

        {modulesWithLogs.length === 0 ? (
          <EmptyState
            title={t("automation.emptyNoModules")}
            description={t("automation.emptyNoModulesDesc")}
          />
        ) : filteredModules.length === 0 ? (
          <EmptyState
            title={t("automation.emptyNoMatch")}
            description={t("automation.emptyNoMatchDesc")}
            actionLabel={t("automation.clearFilters")}
            onAction={() => setFilters(initialFilters)}
          />
        ) : (
          <AutomationModulesGrid
            modules={filteredModules}
            onViewDetails={handleViewDetails}
            onToggleStatus={handleToggleStatus}
            onConfigure={(m) => openConfigure(m)}
          />
        )}

        <AutomationLogsTable logs={logRows} />
      </div>

      <ConfigureAutomationModal
        open={configureOpen}
        onClose={() => setConfigureOpen(false)}
        modules={modulesWithLogs}
        initialModuleId={configureModuleId}
        onSave={handleSaveConfigure}
        loading={automationApi.mutations.updateLoading}
      />

      <AutomationDetailPanel
        module={selectedModule}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onRun={(m) => void handleRunModule(m)}
        onConfigure={(m) => {
          openConfigure(m);
        }}
      />
    </>
  );
}
