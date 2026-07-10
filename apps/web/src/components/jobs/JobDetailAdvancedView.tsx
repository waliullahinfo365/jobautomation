"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { SparklesIcon } from "@/components/icons";
import { JobDetailHeader } from "@/components/jobs/JobDetailHeader";
import { JobOverviewCard } from "@/components/jobs/JobOverviewCard";
import { JobTimeline } from "@/components/jobs/JobTimeline";
import { JobDocumentsCard } from "@/components/jobs/JobDocumentsCard";
import { JobAutomationActivity } from "@/components/jobs/JobAutomationActivity";
import { ApplyStickyBar, shouldShowApplyStickyBar } from "@/components/jobs/ApplyStickyBar";
import { SectionCard } from "@/components/shared/SectionCard";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import type { Job } from "@/types/job";
import { useTranslation } from "@/i18n/useTranslation";

interface JobDetailAdvancedViewProps {
  job: Job;
  jobId: string;
  actionBar: ReactNode;
  duplicateFollowUp: { jobId: string; status: string } | null;
  profileContextLine: string | null;
}

export function JobDetailAdvancedView({
  job,
  jobId,
  actionBar,
  duplicateFollowUp,
  profileContextLine,
}: JobDetailAdvancedViewProps) {
  const { t } = useTranslation();
  const showStickyBar = shouldShowApplyStickyBar(job);

  return (
    <div className={showStickyBar ? "space-y-6 pb-mobile-sticky md:pb-20" : "space-y-6"}>
      <JobDetailHeader job={job} renderActions={<ErrorBoundary>{actionBar}</ErrorBoundary>} />

      {duplicateFollowUp ? (
        <div className="rounded-lg border border-[rgba(229,162,59,0.35)] bg-[var(--amber-bg)] px-4 py-3 text-sm text-[var(--text-2)]">
          <span className="font-medium text-[var(--amber)]">{duplicateFollowUp.status}:</span>{" "}
          {t("jobDetail.duplicateBannerSuffix")}{" "}
          <Link
            href={`/jobs/${duplicateFollowUp.jobId}`}
            className="font-medium text-[var(--violet)] underline underline-offset-2 hover:brightness-110"
          >
            {t("jobDetail.openMatchingJob")}
          </Link>
        </div>
      ) : null}

      {job.profileDocumentContext ? (
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-3)] px-4 py-2.5 text-xs text-[var(--text-3)]">
          <SparklesIcon size={14} className="shrink-0 text-[var(--violet)]" />
          {profileContextLine ? (
            <span className="text-[var(--text-2)]">{profileContextLine}</span>
          ) : (
            <span>
              {t("jobDetail.uploadCvHint")}{" "}
              <Link href="/documents" className="font-medium text-[var(--violet)] underline underline-offset-2">
                {t("nav.documents")}
              </Link>{" "}
              {t("jobDetail.uploadCvHintEnd")}
            </span>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <JobOverviewCard job={job} />

          <SectionCard title="Application Materials">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-[var(--text-3)]">Source CV used</p>
                <p className="mt-1 break-words text-[var(--text-1)]">{job.sourceCvFileName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-3)]">Template used</p>
                <p className="mt-1 break-words text-[var(--text-1)]">{job.coverLetterTemplateFileName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-3)]">Generated cover letter</p>
                {job.generatedCoverLetterLink ? (
                  <a
                    className="mt-1 inline-flex text-[var(--violet)] underline underline-offset-2"
                    href={job.generatedCoverLetterLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open cover letter
                  </a>
                ) : (
                  <p className="mt-1 text-[var(--text-1)]">—</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-3)]">Research document</p>
                {job.researchDocumentLink ? (
                  <a
                    className="mt-1 inline-flex text-[var(--violet)] underline underline-offset-2"
                    href={job.researchDocumentLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open research
                  </a>
                ) : (
                  <p className="mt-1 text-[var(--text-1)]">—</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t("jobDetail.description")}>
            <p className="overflow-hidden whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-2)]">
              {job.description}
            </p>
            {job.aiSummary ? (
              <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <SparklesIcon size={16} className="text-[var(--violet)]" />
                  <p className="text-sm font-medium text-purple-800">{t("jobDetail.aiSummary")}</p>
                </div>
                <p className="text-sm text-purple-700">{job.aiSummary}</p>
              </div>
            ) : null}
          </SectionCard>

          <JobTimeline timeline={job.timeline} />
        </div>

        <div className="space-y-6">
          <JobDocumentsCard documents={job.documents} jobId={jobId} />
          <JobAutomationActivity logs={job.automationLogs} />
        </div>
      </div>

      {showStickyBar ? <ApplyStickyBar job={job} /> : null}
    </div>
  );
}
