"use client";

import * as api from "@/lib/api/applications.api";
import { useCallback } from "react";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useApplicationsApi(options?: { fallbackToMock?: boolean; params?: Record<string, unknown> }) {
  const query = useApiQuery(() => api.listApplications(options?.params), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "applications",
  });

  const createMutation = useApiMutation(api.createApplication);
  const updateMutation = useApiMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) => api.updateApplication(id, payload));
  const markAppliedMutation = useApiMutation(({ id, payload }: { id: string; payload?: Record<string, unknown> }) => api.markApplied(id, payload));
  const scheduleFollowUpMutation = useApiMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    api.scheduleFollowUp(id, payload)
  );
  const markFollowUpSentMutation = useApiMutation((id: string) => api.markFollowUpSent(id));
  const processDueFollowUpsMutation = useApiMutation((payload?: Record<string, unknown>) => api.processDueFollowUps(payload));

  const getDueFollowUps = useCallback(() => api.getDueFollowUps(), []);

  return {
    ...query,
    /** Alias for list payload returned by the API / mock fallback */
    list: query.data,
    createApplication: createMutation.mutate,
    createApplicationLoading: createMutation.loading,
    updateApplication: updateMutation.mutate,
    /** Back-compat aliases */
    create: createMutation.mutate,
    update: updateMutation.mutate,
    markApplied: markAppliedMutation.mutate,
    scheduleFollowUp: scheduleFollowUpMutation.mutate,
    markFollowUpSent: markFollowUpSentMutation.mutate,
    processDueFollowUps: processDueFollowUpsMutation.mutate,
    getDueFollowUps,
    mutations: {
      createLoading: createMutation.loading,
      updateLoading: updateMutation.loading,
      markAppliedLoading: markAppliedMutation.loading,
      scheduleFollowUpLoading: scheduleFollowUpMutation.loading,
      markFollowUpSentLoading: markFollowUpSentMutation.loading,
      processDueFollowUpsLoading: processDueFollowUpsMutation.loading,
    },
  };
}
