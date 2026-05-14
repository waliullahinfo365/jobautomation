"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobsIcon } from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddJobModal } from "@/components/jobs/AddJobModal";
import { JobTable } from "@/components/jobs/JobTable";
import { JobBoard } from "@/components/jobs/JobBoard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { ViewToggle, type ViewMode } from "@/components/shared/ViewToggle";
import { LoadingState } from "@/components/shared/LoadingState";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { Button } from "@/components/ui/button";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { ApiError } from "@/lib/api/client";
import { buildCreateJobPayload, type CreateJobFormPayload } from "@/lib/api/jobs.api";
import { shouldUseMockFallback } from "@/lib/api/mockFallback";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeJobForUi } from "@/lib/utils/resource";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";
import type { Job, JobFilters as JobFiltersType } from "@/types/job";

const initialFilters: JobFiltersType = {
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

export default function JobsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<JobFiltersType>(initialFilters);
  const [view, setView] = useState<ViewMode>("table");
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [localJobsOverlay, setLocalJobsOverlay] = useState<Job[]>([]);

  const jobsApi = useJobsApi({ fallbackToMock: false });

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

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesQuery = !filters.query
        ? true
        : `${job.company} ${job.position} ${job.source}`.toLowerCase().includes(filters.query.toLowerCase());
      const matchesStatus = !filters.status || filters.status === "All" ? true : job.status === filters.status;
      const matchesPriority = !filters.priority || filters.priority === "All" ? true : job.priority === filters.priority;
      const matchesSource = !filters.source || filters.source === "All" ? true : job.source === filters.source;
      return matchesQuery && matchesStatus && matchesPriority && matchesSource;
    });
  }, [jobs, filters]);

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        await jobsApi.archive(id);
        showSuccess(t("jobs.toastArchived"));
        void jobsApi.refetch();
      } catch {
        showError(t("jobs.toastArchiveFailed"));
      }
    },
    [jobsApi, t]
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
    [jobsApi, t]
  );

  if (jobsApi.loading && !jobsApi.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={JobsIcon}
          eyebrow={t("jobs.eyebrow")}
          title={t("jobs.title")}
          description={t("jobs.description")}
          actions={
            <Button type="button" onClick={() => setIsAddJobOpen(true)}>
              {t("jobs.addJob")}
            </Button>
          }
        />
        <LoadingState title={t("jobs.loadingTitle")} description={t("jobs.loadingDesc")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={JobsIcon}
        eyebrow={t("jobs.eyebrow")}
        title={t("jobs.title")}
        description={t("jobs.description")}
        actions={
          <div className="flex items-center gap-2">
            {jobsApi.isUsingFallback && <ApiStatusIndicator usingMock />}
            <Button type="button" onClick={() => setIsAddJobOpen(true)}>
              {t("jobs.addJob")}
            </Button>
          </div>
        }
      />

      <AddJobModal
        open={isAddJobOpen}
        onClose={() => setIsAddJobOpen(false)}
        onSubmit={handleCreateJob}
        loading={jobsApi.createJobLoading}
      />

      <div className="jf-kpi-grid">
        <KpiCard label={t("jobs.kpiNew")} value={jobs.filter((j) => j.status === "New").length} />
        <KpiCard label={t("jobs.kpiReady")} value={jobs.filter((j) => j.status === "Ready to Apply").length} />
        <KpiCard label={t("jobs.kpiApplied")} value={jobs.filter((j) => j.status === "Applied").length} />
        <KpiCard label={t("jobs.kpiInterviews")} value={jobs.filter((j) => j.status === "Interview").length} />
        <KpiCard label={t("jobs.kpiOffers")} value={jobs.filter((j) => j.status === "Offer").length} />
        <KpiCard label={t("jobs.kpiRejected")} value={jobs.filter((j) => j.status === "Rejected").length} />
      </div>

      <div className="space-y-4">
        <JobFilters filters={filters} onChange={setFilters} onClear={() => setFilters(initialFilters)} />
        <div className="flex justify-end">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {view === "table" ? (
        <JobTable
          jobs={filteredJobs}
          onArchive={handleArchive}
          onGenerateResearch={handleGenerateResearch}
          onGenerateDraft={handleGenerateDraft}
        />
      ) : (
        <JobBoard jobs={filteredJobs} />
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="jf-kpi">
      <p className="jf-kpi-label">{label}</p>
      <p className="jf-kpi-value mt-2 text-[26px]">{value}</p>
    </div>
  );
}
