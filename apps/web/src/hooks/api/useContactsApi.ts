"use client";

import * as api from "@/lib/api/contacts.api";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useContactsApi(options?: { fallbackToMock?: boolean; params?: Record<string, unknown> }) {
  const query = useApiQuery(() => api.listContacts(options?.params), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "contacts",
  });

  const createMutation = useApiMutation(api.createContact);
  const updateMutation = useApiMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) => api.updateContact(id, payload));
  const markFollowedUpMutation = useApiMutation((id: string) => api.markFollowedUp(id));

  return {
    ...query,
    list: query.data,
    createContact: createMutation.mutate,
    updateContact: updateMutation.mutate,
    markFollowedUp: markFollowedUpMutation.mutate,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    mutations: {
      createLoading: createMutation.loading,
      updateLoading: updateMutation.loading,
      markFollowedUpLoading: markFollowedUpMutation.loading,
    },
  };
}
