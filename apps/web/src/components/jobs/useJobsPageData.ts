"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { useJobPipelineSummary } from "@/context/JobPipelineSummaryContext";
import { ApiError } from "@/lib/api/client";
import { buildCreateJobPayload, type CreateJobFormPayload } from "@/lib/api/jobs.api";
import { shouldUseMockFallback } from "@/lib/api/mockFallback";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeJobForUi, normalizeJobSourceForUi } from "@/lib/utils/resource";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";
import type { Job, JobFilters as JobFiltersType } from "@/types/job";

export const initialJobFilters: JobFiltersType = {
  query: "",
  status: "All",
  priority: "All",
  source: "All",
};

function buildLocalDemoJob(input: CreateJobFormPayload): Job {
  const id = `local-${Date.now()}`;
  const now = new Date().toISOString();
  return normalizeJobForUi({
    _id: id,
    id,
    company: input.company,
    position: input.position,
    title: input.position,
    source: input.source,
    status: input.status,
    priority: input.priority,
    location: input.location ?? "",
    jobUrl: input.jobUrl ?? "",
    url: input.jobUrl ?? "",
    salaryRange: input.salaryRange ?? "",
    deadline: input.deadline,
    description: input.description ?? "",
    dateFound: now,
    lastUpdated: now,
    createdAt: now,
    updatedAt: now,
    documents: [],
    timeline: [],
    automationLogs: [],
    remote: false,
    aiSummary: "",
    duplicateStatus: "Skipped Duplicate",
    folderCreated: false,
    tags: [],
    contactIds: [],
  });
}

export type JobTab = "new" | "saved" | "all";

export const TAB_STATUSES: Record<JobTab, string[] | null> = {
  new: ["New"],
  saved: ["Saved", "Drafting", "Ready"],
  all: null,
};

export function useJobsPageData() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const pipeline = useJobPipelineSummary();
  const [filters, setFilters] = useState<JobFiltersType>(initialJobFilters);
  const [activeTab, setActiveTab] = useState<JobTab>("new");
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [localJobsOverlay, setLocalJobsOverlay] = useState<Job[]>([]);

  useEffect(() => {
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const q = searchParams.get("q");
    if (searchParams.get("add") === "1") setIsAddJobOpen(true);
    const next: JobFiltersType = { ...initialJobFilters };
    if (status && status !== "All") {
      next.status = status as JobFiltersType["status"];
      if (status === "New") setActiveTab("new");
      else if (["Saved", "Drafting", "Ready"].includes(status)) setActiveTab("saved");
      else setActiveTab("all");
    }
    if (source) {
      next.source = normalizeJobSourceForUi(source);
    }
    if (q) {
      next.query = q;
      setActiveTab("all");
    }
    if (status || source || q) setFilters(next);
  }, [searchParams]);

  const jobsListParams = useMemo(() => {
    const limit = 200;
    if (activeTab === "new") return { limit, status: "New" };
    if (activeTab === "saved") return { limit, status: "Saved,Drafting,Ready,Research,Ready to Apply" };
    return { limit };
  }, [activeTab]);

  const jobsApi = useJobsApi({ fallbackToMock: false, params: jobsListParams });

  useEffect(() => {
    if (!jobsApi.isUsingFallback) {
      setLocalJobsOverlay([]);
    }
  }, [jobsApi.isUsingFallback]);

  const jobs = useMemo((): Job[] => {
    const raw = normalizeListResponse(jobsApi.data);
    const base = raw.map(normalizeJobForUi);
    if (!localJobsOverlay.length) return base;
    const seen = new Set(base.map((j) => j.id));
    const extra = localJobsOverlay.filter((j) => !seen.has(j.id));
    return [...extra, ...base];
  }, [jobsApi.data, localJobsOverlay]);

  const useServerPipelineCounts = Boolean(pipeline.summary);
  const countStatus = (status: string) =>
    useServerPipelineCounts ? pipeline.count(status) : jobs.filter((j) => j.status === status).length;
  const savedTabCount = useServerPipelineCounts
    ? pipeline.count("Saved") + pipeline.count("Drafting") + pipeline.count("Ready")
    : jobs.filter((j) => TAB_STATUSES.saved!.includes(j.status)).length;
  const allTabCount = useServerPipelineCounts ? pipeline.totalActive : jobs.length;

  const tabFilteredJobs = useMemo(() => {
    const allowed = TAB_STATUSES[activeTab];
    if (!allowed) return jobs;
    return jobs.filter((j) => allowed.includes(j.status));
  }, [jobs, activeTab]);

  const filteredJobs = useMemo(() => {
    return tabFilteredJobs.filter((job) => {
      const matchesQuery = !filters.query
        ? true
        : `${job.company} ${job.position} ${job.source}`.toLowerCase().includes(filters.query.toLowerCase());
      const matchesStatus = !filters.status || filters.status === "All" ? true : job.status === filters.status;
      const matchesPriority = !filters.priority || filters.priority === "All" ? true : job.priority === filters.priority;
      const matchesSource = !filters.source || filters.source === "All" ? true : job.source === filters.source;
      return matchesQuery && matchesStatus && matchesPriority && matchesSource;
    });
  }, [tabFilteredJobs, filters]);

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        await jobsApi.archive(id);
        showSuccess(t("jobs.inbox.toastSkipped"));
        await jobsApi.refetch();
        await pipeline.refetch();
      } catch {
        showError(t("jobs.toastArchiveFailed"));
      }
    },
    [jobsApi, t, pipeline]
  );

  const handleGenerateResearch = useCallback(
    async (id: string) => {
      try {
        await jobsApi.generateResearch({ id, execute: false });
        showSuccess(t("jobs.toastResearchQueued"));
      } catch {
        showError(t("jobs.toastResearchFail"));
      }
    },
    [jobsApi, t]
  );

  const handleGenerateDraft = useCallback(
    async (id: string) => {
      try {
        await jobsApi.generateDraft({ id, execute: false });
        showSuccess(t("jobs.toastDraftQueued"));
      } catch {
        showError(t("jobs.toastDraftFail"));
      }
    },
    [jobsApi, t]
  );

  const handleCreateJob = useCallback(
    async (form: CreateJobFormPayload) => {
      const payload = buildCreateJobPayload(form);
      try {
        await jobsApi.createJob(payload);
        showSuccess(t("jobs.toastCreated"));
        setIsAddJobOpen(false);
        await jobsApi.refetch();
        await pipeline.refetch();
      } catch (e) {
        if (shouldUseMockFallback(e)) {
          setLocalJobsOverlay((prev) => [buildLocalDemoJob(form), ...prev]);
          showInfo(t("jobs.toastOfflineDemo"));
          setIsAddJobOpen(false);
          return;
        }
        const msg = e instanceof ApiError ? e.message : t("jobs.toastCreateFail");
        showError(msg);
      }
    },
    [jobsApi, t, pipeline]
  );

  const tabCounts: Record<JobTab, number> = {
    new: useServerPipelineCounts ? pipeline.count("New") : jobs.filter((j) => TAB_STATUSES.new!.includes(j.status)).length,
    saved: savedTabCount,
    all: allTabCount,
  };

  return {
    t,
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    isAddJobOpen,
    setIsAddJobOpen,
    jobsApi,
    filteredJobs,
    tabFilteredJobs,
    hasActiveFilters:
      Boolean(filters.query) ||
      (filters.status !== "All" && filters.status !== undefined) ||
      (filters.priority !== "All" && filters.priority !== undefined) ||
      (filters.source !== "All" && filters.source !== undefined),
    tabCounts,
    countStatus,
    handleArchive,
    handleGenerateResearch,
    handleGenerateDraft,
    handleCreateJob,
  };
}
