"use client";

import { useCallback, useMemo, useState } from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { JobMatchBlock } from "@/components/dashboard/JobMatchBlock";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ApplicationPipelineChart } from "@/components/dashboard/ApplicationPipelineChart";
import { RecentJobsTable } from "@/components/dashboard/RecentJobsTable";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { AutomationHealth } from "@/components/dashboard/AutomationHealth";
import { FollowUpReminders } from "@/components/dashboard/FollowUpReminders";
import { AutomationLogTable } from "@/components/automation/AutomationLogTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { useDashboardOverview } from "@/hooks/api/useDashboardOverview";
import { useTranslation } from "@/i18n/useTranslation";
import type { FollowUpReminderItem } from "@/data/mockApplications";
import type { AutomationLog, AutomationModule } from "@/types/automation";
import type { Job, JobSummary } from "@/types/job";
import type { Application } from "@/types/application";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeAutomationLogForUi, normalizeAutomationModuleForUi, normalizeJobForUi } from "@/lib/utils/resource";
import * as automationApi from "@/lib/api/automation.api";
import { showError, showSuccess } from "@/lib/ui/toast";

const PIPELINE_STATUSES = [
  "New", "Research", "Drafting", "Ready to Apply",
  "Applied", "Interview", "Offer", "Rejected",
] as const;

function toJobSummary(job: Job): JobSummary {
  return {
    id: job.id,
    _id: job._id,
    position: job.position,
    title: job.title,
    company: job.company,
    location: job.location,
    source: job.source,
    status: job.status,
    priority: job.priority,
    salaryRange: job.salaryRange,
    deadline: job.deadline,
    dateFound: job.dateFound,
    lastUpdated: job.lastUpdated,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    applicationCount: 0,
  };
}

function computeFollowUpsDue(applications: Application[]): FollowUpReminderItem[] {
  return applications
    .filter((app) => app.followUpDate && (app.followUpStatus === "Due Today" || app.followUpStatus === "Overdue" || app.followUpStatus === "Scheduled"))
    .slice(0, 5)
    .map((app): FollowUpReminderItem => ({
      id: `fup_${app.id}`,
      company: app.company,
      position: app.position,
      followUpDate: String(app.followUpDate),
      contactEmail: app.contactEmail,
      reminderStatus: app.followUpStatus === "Due Today" ? "Due Today" : app.followUpStatus === "Overdue" ? "Overdue" : "Scheduled",
    }));
}

export function DashboardPageClient() {
  const { t } = useTranslation();
  const { jobsQuery, applicationsQuery: appsQuery, automationQuery, refetchAll } = useDashboardOverview({ fallbackToMock: false });
  const [backfillLoading, setBackfillLoading] = useState(false);

  const jobs = useMemo((): Job[] => {
    const raw = normalizeListResponse(jobsQuery.data);
    return raw.map(normalizeJobForUi);
  }, [jobsQuery.data]);

  const applications = useMemo((): Application[] => {
    return normalizeListResponse<Application>(appsQuery.data);
  }, [appsQuery.data]);

  const modules = useMemo((): AutomationModule[] => {
    const raw = normalizeListResponse(automationQuery.data);
    return raw.map(normalizeAutomationModuleForUi);
  }, [automationQuery.data]);

  const automationLogs = useMemo((): AutomationLog[] => {
    return normalizeListResponse(automationQuery.logs.data).map(normalizeAutomationLogForUi);
  }, [automationQuery.logs.data]);

  const jobSummaries = useMemo(() => jobs.map(toJobSummary), [jobs]);

  const followUpReminders = useMemo((): FollowUpReminderItem[] => {
    if (applications.length > 0) return computeFollowUpsDue(applications);
    return [];
  }, [applications]);

  const stats = useMemo(() => {
    const activeModules = modules.filter((m) => m.status === "Healthy" || m.status === "Ready");
    const totalRuns = modules.reduce((sum, m) => sum + (m.totalRuns ?? 0), 0);
    const failedRuns = modules.reduce((sum, m) => sum + (m.failedRuns ?? 0), 0);
    const automationSuccessRate = totalRuns > 0
      ? Math.round(((totalRuns - failedRuns) / totalRuns) * 100)
      : modules.length > 0 ? 100 : null;

    return {
      totalJobsTracked: jobs.length,
      applicationsSent: applications.filter((app) => app.appliedAt).length || applications.filter((app) => app.applicationStatus === "Applied" || app.status === "Applied").length,
      interviewsScheduled: applications.filter((app) => (app.interviewIds ?? []).length > 0 || app.applicationStatus === "Interview" || app.status === "Interview").length,
      offersReceived: jobs.filter((job) => job.status === "Offer").length,
      followUpsDue: followUpReminders.length,
      automationsActive: activeModules.length,
      automationSuccessRate,
    };
  }, [jobs, applications, modules, followUpReminders]);

  const importLastSevenDays = useCallback(async () => {
    setBackfillLoading(true);
    try {
      await automationApi.backfillJobIntake({ label: "job alerts", days: 7, dryRun: false, enqueueDownstream: true });
      showSuccess(t("dashboard.emptyJobs.backfillStarted"));
      await refetchAll();
    } catch (error) {
      showError(error instanceof Error ? error.message : t("dashboard.emptyJobs.backfillFailed"));
    } finally {
      setBackfillLoading(false);
    }
  }, [refetchAll, t]);

  const pipelineBreakdown = useMemo(
    () => PIPELINE_STATUSES.map((status) => ({ status, count: jobs.filter((job) => job.status === status).length })),
    [jobs]
  );

  const isUsingAnyFallback =
    jobsQuery.isUsingFallback ||
    appsQuery.isUsingFallback ||
    automationQuery.isUsingFallback ||
    automationQuery.logs.isUsingFallback;
  const isInitialLoading = (jobsQuery.loading && !jobsQuery.data) || (appsQuery.loading && !appsQuery.data);

  if (isInitialLoading) {
    return (
      <div className="section-spacing">
        <LoadingState title={t("dashboard.loadingTitle")} description={t("dashboard.loadingDesc")} />
      </div>
    );
  }

  return (
    <div className="section-spacing min-w-0">
      <DashboardHero showMockIndicator={isUsingAnyFallback} />

      <StatsCards stats={stats} />

      <JobMatchBlock />

      <div className="jf-row-2 min-w-0">
        <ApplicationPipelineChart
          data={pipelineBreakdown}
          loading={jobsQuery.loading}
          error={jobsQuery.error}
          isUsingFallback={jobsQuery.isUsingFallback}
        />
        <UpcomingDeadlines jobs={jobSummaries} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RecentJobsTable jobs={jobSummaries} />
        </div>
        <div className="min-w-0">
          <FollowUpReminders reminders={followUpReminders} />
        </div>
      </div>

      <AutomationHealth
        modules={modules}
        jobsCount={jobs.length}
        onImportGmail={importLastSevenDays}
        importLoading={backfillLoading}
      />

      <AutomationLogTable logs={automationLogs} />
    </div>
  );
}
