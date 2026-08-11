"use client";

import Link from "next/link";
import type { Job } from "@/types/job";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { JobDocumentsReadiness, JobDetailSimpleHeader } from "@/components/jobs/JobDetailSimpleParts";
import { JobDetailPrepareStickyBar } from "@/components/jobs/JobDetailPrepareStickyBar";
import { resolveExternalJobPostingUrl } from "@/lib/utils/job-posting-url";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

interface JobDetailSimpleViewProps {
  job: Job;
  jobId: string;
  actionDisabled: boolean;
  actionLoading: string | null;
  logAppLoading: boolean;
  onMarkApplied: () => void;
  onNotInterested: () => void;
}

export function JobDetailSimpleView({
  job,
  jobId,
  actionDisabled,
  actionLoading,
  logAppLoading,
  onMarkApplied,
  onNotInterested,
}: JobDetailSimpleViewProps) {
  const { t } = useTranslation();
  const postingUrl = resolveExternalJobPostingUrl(job);

  return (
    <div className="mx-auto min-w-0 w-full max-w-lg space-y-5 pb-mobile-sticky sm:max-w-xl md:mx-0 md:max-w-none md:pb-8">
      <JobDetailSimpleHeader job={job} />

      <JobDocumentsReadiness job={job} />

      <SectionCard title={t("jobDetail.description")}>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-[var(--text-2)]">
          {job.description?.trim() ? job.description : t("jobDetail.simple.noDescription")}
        </p>
      </SectionCard>

      <div className="hidden gap-2 md:grid md:grid-cols-2">
        <Link
          href={`/jobs/${jobId}/apply`}
          className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-b from-[#7B8EFF] to-[#4D63E0] px-4 text-[15px] font-semibold text-white hover:from-[#8A9BFF] hover:to-[#5A72E8]"
        >
          {t("labels.prepare")}
        </Link>
        {postingUrl ? (
          <a
            href={postingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 text-[15px] font-semibold text-[var(--text-1)] hover:bg-[var(--surface-2)]"
          >
            {t("jobDetail.openPosting")}
          </a>
        ) : (
          <span className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] px-4 text-[14px] text-[var(--text-4)]">
            {t("jobDetail.simple.noJobLink")}
          </span>
        )}
        <Button
          type="button"
          variant="secondary"
          className="min-h-[48px] rounded-2xl text-[15px] font-semibold"
          disabled={actionDisabled || logAppLoading}
          onClick={onMarkApplied}
        >
          {t("jobs.markApplied")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "min-h-[48px] rounded-2xl text-[15px] font-semibold",
            "text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
          )}
          disabled={actionDisabled || actionLoading === "archive"}
          onClick={onNotInterested}
        >
          {t("jobDetail.simple.notInterested")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 md:hidden">
        {postingUrl ? (
          <a
            href={postingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-[14px] font-semibold text-[var(--text-1)]"
          >
            {t("jobDetail.openPosting")}
          </a>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px] rounded-xl text-[14px] font-semibold"
          disabled={actionDisabled || logAppLoading}
          onClick={onMarkApplied}
        >
          {t("jobs.markApplied")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] rounded-xl text-[14px] font-semibold text-rose-600 hover:text-rose-600"
          disabled={actionDisabled || actionLoading === "archive"}
          onClick={onNotInterested}
        >
          {t("jobDetail.simple.notInterested")}
        </Button>
      </div>

      <JobDetailPrepareStickyBar jobId={jobId} />
    </div>
  );
}
