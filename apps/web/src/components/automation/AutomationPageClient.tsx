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
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";

const initialFilters: AutomationFilterState = {
  query: "",
  status: "All",
  category: "All",
};

export function AutomationPageClient() {
  const automationApi = useAutomationApi({ fallbackToMock: true });

  const [localModuleOverrides, setLocalModuleOverrides] = useState<Record<string, Partial<AutomationModule>>>({});
  const [selectedModule, setSelectedModule] = useState<AutomationModule | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AutomationTab>("All");
  const [filters, setFilters] = useState<AutomationFilterState>(initialFilters);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [configureModuleId, setConfigureModuleId] = useState<string | null>(null);

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
    return modulesWithLogs.filter((module) => {
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
        showInfo("API offline, updated module locally.");
        setConfigureOpen(false);
        return;
      }
      try {
        await automationApi.updateAutomationModule({ moduleKey: key, payload });
        showSuccess("Automation configuration saved.");
        setConfigureOpen(false);
        await automationApi.refetch();
      } catch {
        showError("Could not save configuration.");
      }
    },
    [automationApi]
  );

  const handleToggleStatus = async (moduleId: string, nextStatus: AutomationStatus) => {
    const mod = modulesWithLogs.find((m) => m.id === moduleId);
    if (!mod) return;

    if (automationApi.isUsingFallback) {
      setLocalModuleOverrides((prev) => ({
        ...prev,
        [moduleId]: { ...prev[moduleId], status: nextStatus },
      }));
      showInfo("API offline, updated module locally.");
      return;
    }

    try {
      await automationApi.updateAutomationModule({
        moduleKey: resolveAutomationBackendModuleKey(moduleId),
        payload: { status: automationUiStatusToBackend(nextStatus) },
      });
      showSuccess("Module status updated.");
      await automationApi.refetch();
    } catch {
      showError("Could not update module.");
    }
  };

  const handleRunModule = async (module: AutomationModule) => {
    const moduleKey = resolveAutomationBackendModuleKey(module.id);
    const payload: Record<string, unknown> = {};

    if (automationApi.isUsingFallback) {
      showInfo("API offline — Run Now would queue this module when the API is available.");
      return;
    }

    try {
      const res = await automationApi.runAutomationModule({ moduleKey, payload, execute: false });
      const r = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
      const status = String(r.status ?? "").toLowerCase();
      const message = String(r.message ?? "").toLowerCase();
      if (status === "completed" || status === "success") {
        showSuccess("Automation completed.");
      } else if (
        status.includes("queued") ||
        status.includes("pending") ||
        message.includes("queue") ||
        message.includes("facade")
      ) {
        showInfo(
          "Automation queued. In the current demo mode, background execution requires workers or inline execution."
        );
      } else if (status === "warning" || message.includes("warn")) {
        showInfo("Automation queued with a warning — check logs for details.");
      } else {
        showSuccess(`Automation queued${r.operationId ? ` (run ${String(r.operationId).slice(0, 12)}…)` : ""}.`);
      }
      await automationApi.refetch();
    } catch {
      showError("Could not queue automation run.");
    }
  };

  const initialModulesLoading =
    automationApi.modulesQuery.loading && automationApi.modulesQuery.data === undefined;

  if (initialModulesLoading) {
    return (
      <LoadingState
        title="Loading automation"
        description="Fetching modules and execution logs…"
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
        title="Automation unavailable"
        message={automationApi.error.message}
        actionLabel="Retry"
        onAction={() => void automationApi.refetch()}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          icon={AutomationIcon}
          eyebrow="Automation Studio"
          title="Automation Center"
          description="Monitor, control, and review every automation module in the job application workflow."
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
                Refresh
              </Button>
              <Button type="button" onClick={() => openConfigure()}>
                <SettingsIcon size={16} className="mr-2" />
                Configure Automation
              </Button>
            </div>
          }
        />

        <AutomationStatsCards stats={stats} />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AutomationTabs value={activeTab} onChange={setActiveTab} />
          <p className="text-xs text-[var(--text-3)]">
            Search and tabs filter the loaded module list{automationApi.isUsingFallback ? " (demo dataset)." : "."}
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
            title="No automation modules"
            description="Seed automation modules or connect the API to load modules for this workspace."
          />
        ) : filteredModules.length === 0 ? (
          <EmptyState
            title="No matching modules"
            description="Adjust filters or clear search."
            actionLabel="Clear filters"
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
