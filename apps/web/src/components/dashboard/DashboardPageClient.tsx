"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { ApplicationPipelineChart } from "@/components/dashboard/ApplicationPipelineChart";
import { LoadingState } from "@/components/shared/LoadingState";
import { useTranslation } from "@/i18n/useTranslation";
import { jobSourceDisplayLabel } from "@/i18n/job-filters";
import { getTodaySummary, type TodayAction } from "@/lib/api/today.api";
import { importChannelToSourceFilter } from "@/lib/jobs/pipeline-stage";
import {
  JobsIcon,
  DocumentsIcon,
  AutomationIcon,
  SparkleIcon,
  ArrowRightIcon,
  InterviewsIcon,
  FollowUpIcon,
} from "@/components/icons";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

function getGreeting(t: (key: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t("today.greetingMorning");
  if (h < 18) return t("today.greetingAfternoon");
  return t("today.greetingEvening");
}

function actionIcon(type: string): React.ReactNode {
  switch (type) {
    case "review_jobs":
      return <JobsIcon size={20} />;
    case "follow_up":
      return <FollowUpIcon size={20} />;
    case "interviews":
      return <InterviewsIcon size={20} />;
    case "missing_cv":
    case "missing_cover_letter_template":
      return <DocumentsIcon size={20} />;
    case "ready_to_apply":
      return <AutomationIcon size={20} />;
    default:
      return <SparkleIcon size={20} />;
  }
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
  const [today, setToday] = useState<Awaited<ReturnType<typeof getTodaySummary>> | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);

  useEffect(() => {
    void getTodaySummary()
      .then(setToday)
      .catch((e) => setTodayError(e instanceof Error ? e.message : "Failed to load Today"))
      .finally(() => setTodayLoading(false));
  }, []);

  const actionCards: ActionCard[] = useMemo(() => {
    if (!today?.actions?.length) {
      if (todayLoading) return [];
      return [
        {
          id: "all-good",
          icon: <SparkleIcon size={20} />,
          title: t("today.allCaughtUpTitle"),
          description: t("today.allCaughtUpDesc"),
          buttonLabel: t("today.reviewJobs"),
          href: "/jobs/review",
        },
      ];
    }
    return today.actions.map((a: TodayAction) => ({
      id: a.type,
      icon: actionIcon(a.type),
      title: a.title,
      description: a.description,
      buttonLabel: a.cta,
      href: a.href,
      urgent: a.type === "follow_up",
    }));
  }, [today, todayLoading, t]);

  const pipelineBreakdown = today?.pipelineStages ?? [];
  const pipelineLoading = todayLoading;
  const importChannelCounts = useMemo(
    () => (today?.jobsBySource ?? []).map((r) => [r.source, r.count] as const),
    [today?.jobsBySource]
  );

  const PIPELINE_STAGES = [
    { key: "New", label: t("today.pipeline.new") },
    { key: "Saved", label: t("today.pipeline.saved") },
    { key: "Drafting", label: t("today.pipeline.drafting") },
    { key: "Ready", label: t("today.pipeline.ready") },
    { key: "Applied", label: t("today.pipeline.applied") },
    { key: "Interview", label: t("today.pipeline.interview") },
    { key: "Offer", label: t("today.pipeline.offer") },
    { key: "Closed", label: t("today.pipeline.closed") },
  ];

  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: pipelineBreakdown.find((p) => p.status === stage.key)?.count ?? 0,
  }));

  const jobsToReview = today?.jobsToReviewToday ?? 0;

  if (todayLoading && !today) {
    return (
      <div className="section-spacing">
        <LoadingState title={t("today.loadingTitle")} description={t("today.loadingDesc")} />
      </div>
    );
  }

  if (todayError && !today) {
    return (
      <div className="section-spacing">
        <LoadingState title={t("today.errorTitle")} description={todayError} />
      </div>
    );
  }

  return (
    <div className="section-spacing min-w-0 space-y-8">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[var(--text-1)] sm:text-[26px]">
          {getGreeting(t)}.{" "}
          {jobsToReview > 0
            ? t("today.headlineReview").replace("{{count}}", String(jobsToReview))
            : t("today.headlineCaughtUp")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-3)]">{t("today.subtitle")}</p>
      </div>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
          {t("today.actionsTitle")}
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
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  card.urgent ? "bg-amber-500/15 text-amber-600" : "bg-[var(--accent-bg)] text-[var(--accent-hi)]"
                )}
              >
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

      {importChannelCounts.length > 0 ? (
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
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {importChannelCounts.map(([source, count]) => (
              <Link
                key={source}
                href={`/jobs?source=${encodeURIComponent(importChannelToSourceFilter(source))}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2 text-[12.5px] shadow-sm transition-colors hover:border-[var(--accent-ring)]"
              >
                <span className="font-medium text-[var(--text-1)]">{jobSourceDisplayLabel(source, t)}</span>
                <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-hi)]">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
            {t("today.pipelineTitle")}
          </h2>
          <Link href="/insights" className="text-[12px] text-[var(--accent-hi)] hover:underline">
            {t("today.viewInsights")}
          </Link>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {pipelineCounts.map((stage, idx) => (
            <div key={stage.key} className="flex shrink-0 items-center gap-2">
              <Link
                href={`/jobs?status=${encodeURIComponent(stage.key)}`}
                className="flex min-w-[72px] flex-col items-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2.5 text-center shadow-sm transition-colors hover:border-[var(--accent-ring)]"
              >
                <span className="text-[20px] font-bold text-[var(--text-1)]">{stage.count}</span>
                <span className="mt-0.5 text-[11px] text-[var(--text-3)]">{stage.label}</span>
              </Link>
              {idx < pipelineCounts.length - 1 && (
                <ArrowRightIcon size={12} className="shrink-0 text-[var(--text-4)]" />
              )}
            </div>
          ))}
        </div>

        <ApplicationPipelineChart
          data={pipelineBreakdown}
          loading={pipelineLoading}
          error={todayError ? new Error(todayError) : null}
          isUsingFallback={false}
        />
      </section>

      <section className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-6">
        <Link
          href="/jobs/review"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-[#7488FF] to-[#4D63E0] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:from-[#8499FF] hover:to-[#5a72e8]"
        >
          <SparkleIcon size={14} />
          {t("today.quickReview")}
        </Link>
        <Link
          href="/job-guru"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
        >
          <AutomationIcon size={14} />
          {BRAND.productName}
        </Link>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
        >
          <DocumentsIcon size={14} />
          {t("nav.documents")}
        </Link>
      </section>
    </div>
  );
}
