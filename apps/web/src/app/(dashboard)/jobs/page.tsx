"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobsIcon } from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddJobModal } from "@/components/jobs/AddJobModal";
import { JobTable } from "@/components/jobs/JobTable";
import { JobBoard } from "@/components/jobs/JobBoard";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { ViewToggle, type ViewMode } from "@/components/shared/ViewToggle";
import { LoadingState } from "@/components/shared/LoadingState";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { Button } from "@/components/ui/button";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { useJobPipelineSummary } from "@/context/JobPipelineSummaryContext";
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

type JobTab = "new" | "saved" | "all";

const TAB_STATUSES: Record<JobTab, string[] | null> = {
  new: ["New"],
  saved: ["Research", "Drafting", "Ready to Apply"],
  all: null,
};

export default function JobsPage() {
  const { t } = useTranslation();
  const pipeline = useJobPipelineSummary();
  const [filters, setFilters] = useState<JobFiltersType>(initialFilters);
  const [view, setView] = useState<ViewMode>("table");
  const [activeTab, setActiveTab] = useState<JobTab>("new");
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

  /** KPI + tab badges use server aggregates so they are not capped by the jobs list page size (default 20). */
  const useServerPipelineCounts = Boolean(pipeline.summary);
  const countStatus = (status: string) =>
    useServerPipelineCounts ? pipeline.count(status) : jobs.filter((j) => j.status === status).length;
  const savedTabCount = useServerPipelineCounts
    ? pipeline.count("Research") + pipeline.count("Drafting") + pipeline.count("Ready to Apply")
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
        showSuccess(t("jobs.toastArchived"));
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
        <KpiCard label={t("jobs.kpiNew")} value={countStatus("New")} />
        <KpiCard label={t("jobs.kpiReady")} value={countStatus("Ready to Apply")} />
        <KpiCard label={t("jobs.kpiApplied")} value={countStatus("Applied")} />
        <KpiCard label={t("jobs.kpiInterviews")} value={countStatus("Interview")} />
        <KpiCard label={t("jobs.kpiOffers")} value={countStatus("Offer")} />
        <KpiCard label={t("jobs.kpiRejected")} value={countStatus("Rejected")} />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-1">
        {(["new", "saved", "all"] as JobTab[]).map((tab) => {
          const labels: Record<JobTab, string> = { new: "New", saved: "Saved", all: "All Jobs" };
          const counts: Record<JobTab, number> = {
            new: useServerPipelineCounts ? pipeline.count("New") : jobs.filter((j) => TAB_STATUSES.new!.includes(j.status)).length,
            saved: savedTabCount,
            all: allTabCount,
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm"
                  : "text-[var(--text-3)] hover:text-[var(--text-2)]"
              }`}
            >
              {labels[tab]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === tab ? "bg-[var(--accent-bg)] text-[var(--accent-hi)]" : "bg-[var(--surface-3)] text-[var(--text-4)]"}`}>
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <JobFilters filters={filters} onChange={setFilters} onClear={() => setFilters(initialFilters)} />
        <div className="hidden justify-end md:flex">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Mobile: card grid always */}
      <div className="grid gap-3 sm:grid-cols-2 md:hidden">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {filteredJobs.length === 0 && (
          <p className="col-span-2 py-8 text-center text-[13px] text-[var(--text-4)]">No jobs in this category yet.</p>
        )}
      </div>

      {/* Desktop: table or board */}
      <div className="hidden md:block">
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
