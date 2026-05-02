"use client";

import { useCallback } from "react";
import * as api from "@/lib/api/integrations.api";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useIntegrationsApi(options?: { fallbackToMock?: boolean }) {
  const listQuery = useApiQuery(() => api.listIntegrations(), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "integrations",
  });

  const healthQuery = useApiQuery(() => api.getIntegrationHealth(), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "integrationsHealth",
  });

  const connectMutation = useApiMutation((input: { provider: string; body: Record<string, unknown> }) =>
    api.connectIntegration(input.provider, input.body)
  );

  const disconnectMutation = useApiMutation((provider: string) => api.disconnectIntegration(provider));

  const testMutation = useApiMutation((provider: string) => api.testIntegration(provider));

  const replyTestMutation = useApiMutation((payload: Record<string, unknown>) => api.replyTest(payload));

  const refetchAll = useCallback(async () => {
    await Promise.all([listQuery.refetch(), healthQuery.refetch()]);
  }, [listQuery.refetch, healthQuery.refetch]);

  return {
    integrations: listQuery.data,
    integrationsLoading: listQuery.loading,
    integrationsError: listQuery.error,
    health: healthQuery.data,
    healthLoading: healthQuery.loading,
    healthError: healthQuery.error,
    isUsingFallback: listQuery.isUsingFallback || healthQuery.isUsingFallback,
    refetch: refetchAll,
    connect: connectMutation.mutate,
    connectLoading: connectMutation.loading,
    disconnect: disconnectMutation.mutate,
    disconnectLoading: disconnectMutation.loading,
    test: testMutation.mutate,
    testLoading: testMutation.loading,
    replyTest: replyTestMutation.mutate,
    gmailReplyTest: replyTestMutation.mutate,
    replyTestLoading: replyTestMutation.loading,
  };
}
