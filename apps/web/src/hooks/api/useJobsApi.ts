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

  return {
    ...query,
    list: query.data,
    create: useApiMutation(jobsApi.createJob).mutate,
    update: useApiMutation(({ id, payload }: { id: string; payload: Record<string, unknown> }) => jobsApi.updateJob(id, payload)).mutate,
    archive: useApiMutation((id: string) => jobsApi.archiveJob(id)).mutate,
    generateResearch: useApiMutation(({ id, execute }: { id: string; execute?: boolean }) => jobsApi.generateResearch(id, { execute })).mutate,
    generateDraft: useApiMutation(({ id, execute }: { id: string; execute?: boolean }) => jobsApi.generateDraft(id, { execute })).mutate,
    runAiProcessing: useApiMutation(({ id, options: runOptions }: { id: string; options?: Record<string, unknown> }) => jobsApi.runAiProcessing(id, runOptions)).mutate,
    provisionFolders: provisionMutation.mutate,
    checkDuplicate: useApiMutation((id: string) => jobsApi.checkDuplicate(id)).mutate,
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
