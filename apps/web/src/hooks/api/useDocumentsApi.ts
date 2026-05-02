"use client";

import * as api from "@/lib/api/documents.api";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useDocumentsApi(options?: { fallbackToMock?: boolean; params?: Record<string, unknown> }) {
  const query = useApiQuery(() => api.listDocuments(options?.params), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "documents",
  });

  const createMutation = useApiMutation(api.createDocument);
  const updateMutation = useApiMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    api.updateDocument(id, payload)
  );
  const routeCvMutation = useApiMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    api.routeCv(id, payload)
  );
  const exportPdfMutation = useApiMutation(({ id, execute }: { id: string; execute?: boolean }) =>
    api.exportPdf(id, { execute })
  );

  return {
    ...query,
    list: query.data,
    createDocument: createMutation.mutate,
    updateDocument: updateMutation.mutate,
    routeCv: routeCvMutation.mutate,
    exportPdf: exportPdfMutation.mutate,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    mutations: {
      createLoading: createMutation.loading,
      updateLoading: updateMutation.loading,
      routeCvLoading: routeCvMutation.loading,
      exportPdfLoading: exportPdfMutation.loading,
    },
  };
}
