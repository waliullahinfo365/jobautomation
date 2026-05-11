"use client";

import { useMemo } from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
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
import { mockFollowUpReminders, type FollowUpReminderItem } from "@/data/mockApplications";
import { automationModules as mockModules } from "@/data/automationModules";
import type { AutomationLog, AutomationModule } from "@/types/automation";
import type { Job, JobSummary } from "@/types/job";
import type { Application } from "@/types/application";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeJobForUi } from "@/lib/utils/resource";

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
  const { jobsQuery, applicationsQuery: appsQuery, automationQuery } = useDashboardOverview({ fallbackToMock: true });

  const jobs = useMemo((): Job[] => {
    const raw = normalizeListResponse(jobsQuery.data);
    return raw.map(normalizeJobForUi);
  }, [jobsQuery.data]);

  const applications = useMemo((): Application[] => {
    return normalizeListResponse<Application>(appsQuery.data);
  }, [appsQuery.data]);

  const modules = useMemo((): AutomationModule[] => {
    const raw = normalizeListResponse(automationQuery.data);
    return raw.length > 0 ? (raw as AutomationModule[]) : mockModules;
  }, [automationQuery.data]);

  const automationLogs = useMemo((): AutomationLog[] => {
    return normalizeListResponse<AutomationLog>(automationQuery.logs.data);
  }, [automationQuery.logs.data]);

  const jobSummaries = useMemo(() => jobs.map(toJobSummary), [jobs]);

  const followUpReminders = useMemo((): FollowUpReminderItem[] => {
    if (applications.length > 0) return computeFollowUpsDue(applications);
    return mockFollowUpReminders;
  }, [applications]);

  const stats = useMemo(() => ({
    totalJobsTracked: jobs.length,
    applicationsSent: applications.filter((app) => app.appliedAt).length || applications.filter((app) => app.applicationStatus === "Applied" || app.status === "Applied").length,
    interviewsScheduled: applications.filter((app) => (app.interviewIds ?? []).length > 0 || app.applicationStatus === "Interview" || app.status === "Interview").length,
    offersReceived: jobs.filter((job) => job.status === "Offer").length,
    followUpsDue: followUpReminders.length,
    automationsActive: modules.filter((m) => m.status === "Active").length,
  }), [jobs, applications, modules, followUpReminders]);

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

      <div className="jf-row-2 min-w-0">
        <ApplicationPipelineChart data={pipelineBreakdown} />
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

      <AutomationHealth modules={modules} />

      <AutomationLogTable logs={automationLogs} variant="dashboard" />
    </div>
  );
}
