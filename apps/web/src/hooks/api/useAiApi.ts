"use client";

import * as api from "@/lib/api/ai.api";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useAiApi() {
  const configQuery = useApiQuery(() => api.getAiConfig());
  const usageQuery = useApiQuery(() => api.getAiUsage());
  const testMutation = useApiMutation((body: Parameters<typeof api.testAi>[0]) => api.testAi(body ?? {}));

  return {
    config: configQuery.data,
    configLoading: configQuery.loading,
    configError: configQuery.error,
    refetchConfig: configQuery.refetch,
    usage: usageQuery.data,
    usageLoading: usageQuery.loading,
    usageError: usageQuery.error,
    refetchUsage: usageQuery.refetch,
    testAi: testMutation.mutate,
    testAiLoading: testMutation.loading,
  };
}
