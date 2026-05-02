"use client";

import * as api from "@/lib/api/interviews.api";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useInterviewsApi(options?: { fallbackToMock?: boolean; params?: Record<string, unknown> }) {
  const query = useApiQuery(() => api.listInterviews(options?.params), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "interviews",
  });

  const createMutation = useApiMutation(api.createInterview);
  const updateMutation = useApiMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    api.updateInterview(id, payload)
  );
  const createCalendarEventMutation = useApiMutation(({ id, execute }: { id: string; execute?: boolean }) =>
    api.createCalendarEvent(id, { execute })
  );
  const markCompleteMutation = useApiMutation((id: string) => api.markComplete(id));

  return {
    ...query,
    list: query.data,
    createInterview: createMutation.mutate,
    updateInterview: updateMutation.mutate,
    createCalendarEvent: createCalendarEventMutation.mutate,
    markComplete: markCompleteMutation.mutate,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    mutations: {
      createLoading: createMutation.loading,
      updateLoading: updateMutation.loading,
      createCalendarEventLoading: createCalendarEventMutation.loading,
      markCompleteLoading: markCompleteMutation.loading,
    },
  };
}
