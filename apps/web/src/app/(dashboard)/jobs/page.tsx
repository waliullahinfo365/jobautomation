"use client";

import { useCallback, useMemo, useState } from "react";
import { JobsIcon } from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { JobTable } from "@/components/jobs/JobTable";
import { JobBoard } from "@/components/jobs/JobBoard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { ViewToggle, type ViewMode } from "@/components/shared/ViewToggle";
import { LoadingState } from "@/components/shared/LoadingState";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { Button } from "@/components/ui/button";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeJobForUi } from "@/lib/utils/resource";
import { showSuccess, showError } from "@/lib/ui/toast";
import type { Job, JobFilters as JobFiltersType } from "@/types/job";

const initialFilters: JobFiltersType = {
  query: "",
  status: "All",
  priority: "All",
  source: "All",
};

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFiltersType>(initialFilters);
  const [view, setView] = useState<ViewMode>("table");

  const jobsApi = useJobsApi({ fallbackToMock: true });

  const jobs = useMemo((): Job[] => {
    const raw = normalizeListResponse(jobsApi.data);
    return raw.map(normalizeJobForUi);
  }, [jobsApi.data]);

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

  const handleArchive = useCallback(async (id: string) => {
    try {
      await jobsApi.archive(id);
      showSuccess("Job archived successfully.");
      void jobsApi.refetch();
    } catch {
      showError("Failed to archive job. Please try again.");
    }
  }, [jobsApi]);

  const handleGenerateResearch = useCallback(async (id: string) => {
    try {
      await jobsApi.generateResearch({ id, execute: false });
      showSuccess("Research generation queued.");
    } catch {
      showError("Failed to queue research generation.");
    }
  }, [jobsApi]);

  const handleGenerateDraft = useCallback(async (id: string) => {
    try {
      await jobsApi.generateDraft({ id, execute: false });
      showSuccess("Draft generation queued.");
    } catch {
      showError("Failed to queue draft generation.");
    }
  }, [jobsApi]);

  if (jobsApi.loading && !jobsApi.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={JobsIcon}
          eyebrow="Job Tracker"
          title="Jobs Pipeline"
          description="Track every opportunity from intake to offer."
          actions={<Button>Add Job</Button>}
        />
        <LoadingState title="Loading jobs..." description="Fetching your job pipeline from the backend." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={JobsIcon}
        eyebrow="Job Tracker"
        title="Jobs Pipeline"
        description="Track every opportunity from intake to offer."
        actions={
          <div className="flex items-center gap-2">
            {jobsApi.isUsingFallback && <ApiStatusIndicator usingMock />}
            <Button>Add Job</Button>
          </div>
        }
      />

      <div className="jf-kpi-grid">
        <KpiCard label="New Jobs" value={jobs.filter((j) => j.status === "New").length} />
        <KpiCard label="Ready to Apply" value={jobs.filter((j) => j.status === "Ready to Apply").length} />
        <KpiCard label="Applications Sent" value={jobs.filter((j) => j.status === "Applied").length} />
        <KpiCard label="Interviews" value={jobs.filter((j) => j.status === "Interview").length} />
        <KpiCard label="Offers" value={jobs.filter((j) => j.status === "Offer").length} />
        <KpiCard label="Rejected" value={jobs.filter((j) => j.status === "Rejected").length} />
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
