"use client";

import { useState } from "react";
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
import { initialJobFilters, type JobTab, useJobsPageData } from "@/components/jobs/useJobsPageData";

export function JobsAdvancedPage() {
  const {
    t,
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    isAddJobOpen,
    setIsAddJobOpen,
    jobsApi,
    filteredJobs,
    tabCounts,
    countStatus,
    handleArchive,
    handleGenerateResearch,
    handleGenerateDraft,
    handleCreateJob,
  } = useJobsPageData();
  const [view, setView] = useState<ViewMode>("table");

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
        <KpiCard label={t("jobs.kpiReady")} value={countStatus("Ready")} />
        <KpiCard label={t("jobs.kpiApplied")} value={countStatus("Applied")} />
        <KpiCard label={t("jobs.kpiInterviews")} value={countStatus("Interview")} />
        <KpiCard label={t("jobs.kpiOffers")} value={countStatus("Offer")} />
        <KpiCard label={t("jobs.kpiRejected")} value={countStatus("Closed")} />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-1 [-webkit-overflow-scrolling:touch]">
        {(["new", "saved", "all"] as JobTab[]).map((tab) => {
          const labels: Record<JobTab, string> = { new: "New", saved: "Saved", all: "All Jobs" };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex min-w-[5.5rem] flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[13px] ${
                activeTab === tab
                  ? "bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm"
                  : "text-[var(--text-3)] hover:text-[var(--text-2)]"
              }`}
            >
              {labels[tab]}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === tab ? "bg-[var(--accent-bg)] text-[var(--accent-hi)]" : "bg-[var(--surface-3)] text-[var(--text-4)]"}`}
              >
                {tabCounts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <JobFilters filters={filters} onChange={setFilters} onClear={() => setFilters(initialJobFilters)} />
        <div className="hidden justify-end md:flex">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      <div className="grid min-w-0 gap-3 md:hidden">
        {filteredJobs.map((job, index) => (
          <JobCard key={job.id ? job.id : `job-card-${index}`} job={job} />
        ))}
        {filteredJobs.length === 0 && (
          <p className="col-span-2 py-8 text-center text-[13px] text-[var(--text-4)]">No jobs in this category yet.</p>
        )}
      </div>

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
