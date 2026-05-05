"use client";

import * as jobsApi from "@/lib/api/jobs.api";
import type { Job } from "@/types/job";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useJobsApi(options?: { fallbackToMock?: boolean; params?: Record<string, unknown> }) {
  const query = useApiQuery(() => jobsApi.listJobs(options?.params), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "jobs",
  });

  const provisionMutation = useApiMutation(({ id, execute }: { id: string; execute?: boolean }) =>
    jobsApi.provisionFolders(id, { execute })
  );
  const createMutation = useApiMutation(jobsApi.createJob);
  const updateMutation = useApiMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
    jobsApi.updateJob(id, payload)
  );
  const archiveMutation = useApiMutation((id: string) => jobsApi.archiveJob(id));
  const generateResearchMutation = useApiMutation(({ id, execute }: { id: string; execute?: boolean }) =>
    jobsApi.generateResearch(id, { execute })
  );
  const generateDraftMutation = useApiMutation(({ id, execute }: { id: string; execute?: boolean }) =>
    jobsApi.generateDraft(id, { execute })
  );
  const runAiProcessingMutation = useApiMutation(({ id, options: runOptions }: { id: string; options?: Record<string, unknown> }) =>
    jobsApi.runAiProcessing(id, runOptions)
  );
  const checkDuplicateMutation = useApiMutation((id: string) => jobsApi.checkDuplicate(id));

  return {
    ...query,
    list: query.data,
    create: createMutation.mutate,
    createJob: createMutation.mutate,
    createJobLoading: createMutation.loading,
    update: updateMutation.mutate,
    archive: archiveMutation.mutate,
    generateResearch: generateResearchMutation.mutate,
    generateDraft: generateDraftMutation.mutate,
    runAiProcessing: runAiProcessingMutation.mutate,
    provisionFolders: provisionMutation.mutate,
    checkDuplicate: checkDuplicateMutation.mutate,
  };
}

/**
 * Hook for fetching a single job by ID.
 * Falls back to the provided mockFallback job if the API is unavailable.
 */
export function useJobDetail(id: string, options?: { fallbackToMock?: boolean; mockFallbackJob?: Job }) {
  return useApiQuery(() => jobsApi.getJob(id), {
    fallbackToMock: options?.fallbackToMock,
    fallbackData: options?.mockFallbackJob,
  });
}
