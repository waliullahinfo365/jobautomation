"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApplicationPipelineChart } from "@/components/dashboard/ApplicationPipelineChart";
import { LoadingState } from "@/components/shared/LoadingState";
import { useDashboardOverview } from "@/hooks/api/useDashboardOverview";
import { useTranslation } from "@/i18n/useTranslation";
import { jobSourceDisplayLabel } from "@/i18n/job-filters";
import type { AutomationModule } from "@/types/automation";
import type { Job } from "@/types/job";
import type { Application } from "@/types/application";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { importChannelGroupKey } from "@/lib/jobs/import-channel-key";
import { normalizeAutomationModuleForUi, normalizeJobForUi } from "@/lib/utils/resource";
import * as automationApi from "@/lib/api/automation.api";
import { getJobPipelineSummary, getReviewQueue } from "@/lib/api/jobs.api";
import { showError, showSuccess } from "@/lib/ui/toast";
import { Button } from "@/components/ui/button";
import {
  JobsIcon,
  ApplicationsIcon,
  DocumentsIcon,
  AutomationIcon,
  SparkleIcon,
  ArrowRightIcon,
  InterviewsIcon,
  FollowUpIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

interface ActionCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  urgent?: boolean;
}

export function DashboardPageClient() {
  const { t } = useTranslation();
  const { jobsQuery, applicationsQuery: appsQuery, automationQuery } = useDashboardOverview({
    fallbackToMock: false,
    params: { limit: 200 },
  });
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [pipelineData, setPipelineData] = useState<{ status: string; count: number }[] | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);

  useEffect(() => {
    getJobPipelineSummary()
      .then((res) => setPipelineData(res.pipeline))
      .catch(() => setPipelineData(null))
      .finally(() => setPipelineLoading(false));
  }, []);

  /** Matches GET /jobs/review/queue (Quick Review), not raw pipeline status "New". */
  const [quickReviewPendingCount, setQuickReviewPendingCount] = useState<number | null>(null);
  useEffect(() => {
    void getReviewQueue(1)
      .then((res) => setQuickReviewPendingCount(typeof res.total === "number" ? res.total : 0))
      .catch(() => setQuickReviewPendingCount(null));
  }, []);

  const jobs = useMemo((): Job[] => {
    const raw = normalizeListResponse(jobsQuery.data);
    return raw.map(normalizeJobForUi);
  }, [jobsQuery.data]);

  const importChannelCounts = useMemo(() => {
    const raw = normalizeListResponse(jobsQuery.data);
    const m = new Map<string, number>();
    for (const row of raw) {
      const r = row as Record<string, unknown>;
      const key = importChannelGroupKey(r.source);
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [jobsQuery.data]);

  const applications = useMemo((): Application[] => {
    return normalizeListResponse<Application>(appsQuery.data);
  }, [appsQuery.data]);

  const modules = useMemo((): AutomationModule[] => {
    const raw = normalizeListResponse(automationQuery.data);
    return raw.map(normalizeAutomationModuleForUi);
  }, [automationQuery.data]);

  const rawNewPipelineCount = jobs.filter((j) => j.status === "New").length;
  /** Prefer API queue total so dashboard matches Quick Review; fallback if queue request fails. */
  const newJobsForReview = quickReviewPendingCount !== null ? quickReviewPendingCount : rawNewPipelineCount;
  const followUpsDue = applications.filter(
    (a) => a.followUpStatus === "Due Today" || a.followUpStatus === "Overdue"
  ).length;
  const interviews = applications.filter(
    (a) => a.applicationStatus === "Interview" || a.status === "Interview"
  ).length;
  const hasCv = modules.some((m) => m.key === "cv-file-routing-automation" && m.status === "Healthy");

  const actionCards: ActionCard[] = useMemo(() => {
    const cards: ActionCard[] = [];

    if (newJobsForReview > 0) {
      cards.push({
        id: "new-jobs",
        icon: <JobsIcon size={20} />,
        title: `${newJobsForReview} new job${newJobsForReview > 1 ? "s" : ""} to review`,
        description: "New job opportunities are waiting for your decision.",
        buttonLabel: "Review Jobs",
        href: "/jobs/review",
      });
    }

    if (followUpsDue > 0) {
      cards.push({
        id: "followups",
        icon: <FollowUpIcon size={20} />,
        title: `${followUpsDue} application${followUpsDue > 1 ? "s" : ""} need${followUpsDue === 1 ? "s" : ""} follow-up`,
        description: `You applied and have not received a reply yet.`,
        buttonLabel: "Send Follow-up",
        href: "/applications",
        urgent: true,
      });
    }

    if (interviews > 0) {
      cards.push({
        id: "interviews",
        icon: <InterviewsIcon size={20} />,
        title: `${interviews} interview${interviews > 1 ? "s" : ""} to prepare`,
        description: "Your next interview is coming up soon.",
        buttonLabel: "Prepare Interview",
        href: "/interviews",
      });
    }

    if (!hasCv) {
      cards.push({
        id: "cv",
        icon: <DocumentsIcon size={20} />,
        title: "Your CV is missing",
        description: "Upload your CV so the assistant can prepare better applications.",
        buttonLabel: "Upload CV",
        href: "/documents",
      });
    }

    if (cards.length === 0) {
      cards.push({
        id: "all-good",
        icon: <SparkleIcon size={20} />,
        title: "You're all caught up",
        description: "No actions needed right now. We'll notify you when something needs attention.",
        buttonLabel: "Review new jobs",
        href: "/jobs/review",
      });
    }

    return cards;
  }, [newJobsForReview, followUpsDue, interviews, hasCv]);

  const pipelineBreakdown = pipelineData ?? [];

  const PIPELINE_STAGES = [
    { key: "New", label: "New" },
    { key: "Research", label: "Saved" },
    { key: "Drafting", label: "Drafting" },
    { key: "Ready to Apply", label: "Ready" },
    { key: "Applied", label: "Applied" },
    { key: "Interview", label: "Interview" },
    { key: "Offer", label: "Offer" },
    { key: "Rejected", label: "Closed" },
  ];

  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: pipelineBreakdown.find((p) => p.status === stage.key)?.count ?? 0,
  }));

  const connectedServices = [
    {
      id: "gmail",
      label: "Job Email Scanner",
      status: modules.some((m) => m.key === "job-intake-engine" && m.status === "Healthy") ? "connected" : "action-needed",
    },
    {
      id: "telegram",
      label: "Telegram",
      status: modules.some((m) => m.key?.includes("telegram") || m.category === "Communication") ? "connected" : "not-connected",
    },
    {
      id: "cv",
      label: "CV",
      status: hasCv ? "connected" : "action-needed",
    },
    {
      id: "calendar",
      label: "Calendar",
      status: modules.some((m) => m.key === "interview-scheduling-automation" && m.status === "Healthy") ? "connected" : "not-connected",
    },
    {
      id: "alerts",
      label: "Job alerts",
      status: modules.some((m) => m.key === "job-intake-engine") ? "connected" : "not-connected",
    },
  ];

  const importLastSevenDays = useCallback(async () => {
    setBackfillLoading(true);
    try {
      await automationApi.backfillJobIntake({ label: "job alerts", days: 7, dryRun: false, enqueueDownstream: true });
      showSuccess(t("dashboard.emptyJobs.backfillStarted"));
    } catch (error) {
      showError(error instanceof Error ? error.message : t("dashboard.emptyJobs.backfillFailed"));
    } finally {
      setBackfillLoading(false);
    }
  }, [t]);

  const isInitialLoading = (jobsQuery.loading && !jobsQuery.data) || (appsQuery.loading && !appsQuery.data);

  if (isInitialLoading) {
    return (
      <div className="section-spacing">
        <LoadingState title={t("dashboard.loadingTitle")} description={t("dashboard.loadingDesc")} />
      </div>
    );
  }

  return (
    <div className="section-spacing min-w-0 space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[var(--text-1)] sm:text-[26px]">
          {getGreeting()}. {newJobsForReview > 0 ? `You have ${newJobsForReview} job${newJobsForReview > 1 ? "s" : ""} to review today.` : "Welcome back."}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-3)]">Here's what needs your attention.</p>
      </div>

      {/* A. Today's Actions */}
      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
          Today&apos;s Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actionCards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border bg-[var(--surface-1)] p-4 shadow-sm transition-shadow hover:shadow-md",
                card.urgent ? "border-amber-500/40 bg-amber-500/5" : "border-[var(--border-default)]"
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg",
                card.urgent ? "bg-amber-500/15 text-amber-600" : "bg-[var(--accent-bg)] text-[var(--accent-hi)]"
              )}>
                {card.icon}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[var(--text-1)]">{card.title}</p>
                <p className="mt-0.5 text-[12.5px] text-[var(--text-3)]">{card.description}</p>
              </div>
              <Link
                href={card.href}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors",
                  card.urgent
                    ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                    : "bg-[var(--accent-bg)] text-[var(--accent-hi)] hover:bg-[var(--accent-ring)]"
                )}
              >
                {card.buttonLabel}
                <ArrowRightIcon size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {jobs.length > 0 && importChannelCounts.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
              {t("dashboard.importChannels.title")}
            </h2>
            <Link href="/jobs" className="text-[12px] text-[var(--accent-hi)] hover:underline">
              {t("dashboard.importChannels.viewJobs")}
            </Link>
          </div>
          <p className="mb-3 text-[12.5px] text-[var(--text-3)]">{t("dashboard.importChannels.subtitle")}</p>
          <div className="flex flex-wrap gap-2">
            {importChannelCounts.map(([source, count]) => (
              <div
                key={source}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2 text-[12.5px] shadow-sm"
              >
                <span className="font-medium text-[var(--text-1)]">{jobSourceDisplayLabel(source, t)}</span>
                <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-hi)]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* B. Your Pipeline */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
            Your Pipeline
          </h2>
          <Link href="/applications" className="text-[12px] text-[var(--accent-hi)] hover:underline">
            View all
          </Link>
        </div>

        {/* Pipeline stage counts */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {pipelineCounts.map((stage, idx) => (
            <div key={stage.key} className="flex shrink-0 items-center gap-2">
              <div className="flex min-w-[72px] flex-col items-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-center shadow-sm">
                <span className="text-[20px] font-bold text-[var(--text-1)]">{stage.count}</span>
                <span className="mt-0.5 text-[11px] text-[var(--text-3)]">{stage.label}</span>
              </div>
              {idx < pipelineCounts.length - 1 && (
                <ArrowRightIcon size={12} className="shrink-0 text-[var(--text-4)]" />
              )}
            </div>
          ))}
        </div>

        {/* Pipeline chart */}
        <ApplicationPipelineChart
          data={pipelineBreakdown}
          loading={pipelineLoading}
          error={pipelineData === null && !pipelineLoading ? new Error("Failed to load") : null}
          isUsingFallback={false}
        />
      </section>

      {/* C. Assistant Status */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
            Connected Services
          </h2>
          <Link href="/settings" className="text-[12px] text-[var(--accent-hi)] hover:underline">
            Manage
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {connectedServices.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3 shadow-sm"
            >
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", {
                  "bg-emerald-500": svc.status === "connected",
                  "bg-amber-400": svc.status === "action-needed",
                  "bg-[var(--surface-4)]": svc.status === "not-connected",
                })}
              />
              <span className="flex-1 text-[13px] font-medium text-[var(--text-1)]">{svc.label}</span>
              <span className={cn("text-[11.5px] font-semibold", {
                "text-emerald-600": svc.status === "connected",
                "text-amber-600": svc.status === "action-needed",
                "text-[var(--text-4)]": svc.status === "not-connected",
              })}>
                {svc.status === "connected" ? "Connected" : svc.status === "action-needed" ? "Action needed" : "Not connected"}
              </span>
            </div>
          ))}
        </div>

        {/* Quick import if no jobs */}
        {jobs.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-center">
            <ApplicationsIcon size={32} className="mx-auto mb-2 text-[var(--text-4)]" />
            <p className="text-[14px] font-semibold text-[var(--text-1)]">No jobs found yet</p>
            <p className="mt-1 text-[13px] text-[var(--text-3)]">
              Connect your email or add a job manually to start building your pipeline.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="sm"
                variant="default"
                onClick={() => void importLastSevenDays()}
                disabled={backfillLoading}
              >
                {backfillLoading ? "Importing…" : "Connect Gmail"}
              </Button>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
              >
                Add job manually
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions footer */}
      <section className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-6">
        <Link href="/jobs/review" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-[#7488FF] to-[#4D63E0] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:from-[#8499FF] hover:to-[#5a72e8]">
          <SparkleIcon size={14} />
          Start Quick Review
        </Link>
        <Link href="/automation" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]">
          <AutomationIcon size={14} />
          Job Assistant
        </Link>
        <Link href="/documents" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]">
          <DocumentsIcon size={14} />
          My Documents
        </Link>
      </section>
    </div>
  );
}
