"use client";

import { SimplePageHeader } from "@/components/shared/SimplePageHeader";
import { SimplePageShell } from "@/components/shared/SimplePageShell";
import { CustomerListPageSkeleton } from "@/components/shared/CustomerPageSkeletons";
import { AddJobModal } from "@/components/jobs/AddJobModal";
import { JobCard } from "@/components/jobs/JobCard";
import { JobInboxFilters } from "@/components/jobs/JobInboxFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { initialJobFilters, type JobTab, useJobsPageData } from "@/components/jobs/useJobsPageData";
import { cn } from "@/lib/utils";

export function JobInboxPage() {
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
    tabFilteredJobs,
    hasActiveFilters,
    tabCounts,
    handleArchive,
    handleCreateJob,
  } = useJobsPageData();

  if (jobsApi.loading && !jobsApi.data) {
    return <CustomerListPageSkeleton />;
  }

  if (jobsApi.error && !jobsApi.data) {
    return (
      <SimplePageShell>
        <SimplePageHeader title={t("jobs.inbox.title")} description={t("jobs.inbox.subtitle")} />
        <ErrorState
          title={t("jobs.loadingTitle")}
          description={jobsApi.error.message}
          actionLabel={t("common.retry")}
          onAction={() => void jobsApi.refetch()}
        />
      </SimplePageShell>
    );
  }

  return (
    <SimplePageShell>
      <SimplePageHeader
        title={t("jobs.inbox.title")}
        description={t("jobs.inbox.subtitle")}
        actions={
          <Button type="button" className="min-h-[44px] w-full rounded-xl sm:w-auto" onClick={() => setIsAddJobOpen(true)}>
            {t("jobs.addJob")}
          </Button>
        }
      />

      <AddJobModal
        open={isAddJobOpen}
        onClose={() => setIsAddJobOpen(false)}
        onSubmit={handleCreateJob}
        loading={jobsApi.createJobLoading}
      />

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-1 [-webkit-overflow-scrolling:touch]">
        {(["new", "saved", "all"] as JobTab[]).map((tab) => {
          const labels: Record<JobTab, string> = {
            new: t("jobs.inbox.tabNew"),
            saved: t("jobs.inbox.tabSaved"),
            all: t("jobs.inbox.tabAll"),
          };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex min-h-[44px] min-w-[5rem] flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[12px] font-medium transition-colors sm:text-[13px]",
                activeTab === tab
                  ? "bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm"
                  : "text-[var(--text-3)] hover:text-[var(--text-2)]"
              )}
            >
              {labels[tab]}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  activeTab === tab
                    ? "bg-[var(--accent-bg)] text-[var(--accent-hi)]"
                    : "bg-[var(--surface-3)] text-[var(--text-4)]"
                )}
              >
                {tabCounts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      <JobInboxFilters filters={filters} onChange={setFilters} onClear={() => setFilters(initialJobFilters)} />

      <div className="grid min-w-0 gap-3">
        {filteredJobs.map((job, index) => (
          <JobCard
            key={job.id ? job.id : `job-inbox-${index}`}
            job={job}
            variant="inbox"
            onSkip={handleArchive}
          />
        ))}
        {filteredJobs.length === 0 ? (
          hasActiveFilters && tabFilteredJobs.length > 0 ? (
            <p className="py-10 text-center text-[14px] leading-relaxed text-[var(--text-3)]">
              {t("jobs.inbox.emptyFiltered")}
            </p>
          ) : (
            <EmptyState
              title={t("jobs.inbox.emptyTitle")}
              description={t("jobs.inbox.emptyDesc")}
              cta={{ label: t("jobs.inbox.connectGmail"), href: "/settings?section=Integrations" }}
              compact
            />
          )
        ) : null}
      </div>
    </SimplePageShell>
  );
}
