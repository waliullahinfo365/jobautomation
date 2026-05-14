"use client";

import * as api from "@/lib/api/automation.api";
import { useCallback } from "react";
import { invalidateApiCache } from "@/lib/api/client";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useAutomationApi(options?: { fallbackToMock?: boolean; params?: Record<string, unknown> }) {
  const p = options?.params;
  const fb = options?.fallbackToMock;

  const modulesQuery = useApiQuery(() => api.listAutomationModuleHealth(), {
    fallbackToMock: fb,
    mockResourceName: "automationModules",
  });

  const logsQuery = useApiQuery(() => api.listAutomationLogs(p), {
    fallbackToMock: fb,
    mockResourceName: "automationLogs",
  });

  const updateMutation = useApiMutation(({ moduleKey, payload }: { moduleKey: string; payload: Record<string, unknown> }) =>
    api.updateAutomationModule(moduleKey, payload)
  );
  const runMutation = useApiMutation(
    ({ moduleKey, payload, execute }: { moduleKey: string; payload?: Record<string, unknown>; execute?: boolean }) =>
      api.runAutomationModule(moduleKey, payload, { execute })
  );
  const resetMutation = useApiMutation(api.resetOperationalData);
  const backfillMutation = useApiMutation(api.backfillJobIntake);
  const debugCountsMutation = useApiMutation(({ adminResetToken }: { adminResetToken: string }) =>
    api.getDebugDataCounts(adminResetToken)
  );

  const refetchAll = useCallback(async () => {
    await Promise.all([modulesQuery.refetch(), logsQuery.refetch()]);
  }, [modulesQuery, logsQuery]);

  const loading = modulesQuery.loading || logsQuery.loading;
  const error = modulesQuery.error ?? logsQuery.error;
  const isUsingFallback = modulesQuery.isUsingFallback || logsQuery.isUsingFallback;

  return {
    modulesQuery,
    logsQuery,
    data: modulesQuery.data,
    list: modulesQuery.data,
    listAutomationModules: modulesQuery.data,
    listAutomationLogs: logsQuery.data,
    refetch: refetchAll,
    refetchModules: modulesQuery.refetch,
    refetchLogs: logsQuery.refetch,
    updateModule: updateMutation.mutate,
    updateAutomationModule: updateMutation.mutate,
    runModule: runMutation.mutate,
    runAutomationModule: runMutation.mutate,
    resetOperationalData: resetMutation.mutate,
    backfillJobIntake: backfillMutation.mutate,
    getDebugDataCounts: debugCountsMutation.mutate,
    clearApiCache: () => invalidateApiCache(),
    loading,
    error,
    isUsingFallback,
    mutations: {
      updateLoading: updateMutation.loading,
      runLoading: runMutation.loading,
      resetLoading: resetMutation.loading,
      backfillLoading: backfillMutation.loading,
      debugCountsLoading: debugCountsMutation.loading,
    },
  };
}
