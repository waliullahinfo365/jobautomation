"use client";

import Link from "next/link";
import { MapPinIcon } from "@/components/icons";
import type { Job } from "@/types/job";
import { JobStatusBadge } from "./JobStatusBadge";
import { JobPriorityBadge } from "./JobPriorityBadge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { jobSourceDisplayLabel } from "@/i18n/job-filters";
import { useTranslation } from "@/i18n/useTranslation";

interface JobCardProps {
  job: Job;
  variant?: "default" | "inbox";
  onSkip?: (id: string) => void;
}

export function JobCard({ job, variant = "default", onSkip }: JobCardProps) {
  const { t } = useTranslation();
  const isNew = job.status === "New";
  const showPriority = job.priority && job.priority !== "Low";

  if (variant === "inbox") {
    return (
      <article
        className={cn(
          "flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border bg-[var(--surface-1)] p-4 shadow-sm",
          isNew ? "border-[var(--accent-ring)]" : "border-[var(--border-default)]"
        )}
      >
        <div className="space-y-1">
          <p className="text-[15px] font-semibold leading-snug text-[var(--text-1)]">{job.company}</p>
          <p className="text-[14px] leading-snug text-[var(--text-2)]">{job.position}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-3)]">
          {job.location ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPinIcon size={12} className="shrink-0" />
              <span className="truncate">
                {job.location}
                {job.remote ? ` · ${t("jobs.remote")}` : ""}
              </span>
            </span>
          ) : null}
          {job.source ? (
            <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[11px]">
              {jobSourceDisplayLabel(job.source, t)}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <JobStatusBadge status={job.status} />
          {showPriority ? <JobPriorityBadge priority={job.priority} /> : null}
          <span className="text-[11px] text-[var(--text-4)]">
            {t("jobs.dateFound")}: {formatDate(job.dateFound)}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-2 pt-1 sm:flex-row sm:items-center">
          <Link
            href={`/jobs/${job.id}/apply`}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#7B8EFF] to-[#4D63E0] px-4 text-[14px] font-semibold text-white shadow-sm hover:from-[#8A9BFF] hover:to-[#5A72E8] sm:flex-1"
          >
            {t("labels.prepare")}
          </Link>
          {onSkip ? (
            <button
              type="button"
              onClick={() => onSkip(job.id)}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] px-4 text-[14px] font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] sm:w-auto sm:min-w-[7rem]"
            >
              {t("labels.skip")}
            </button>
          ) : null}
        </div>

        <Link
          href={`/jobs/${job.id}`}
          className="text-center text-[13px] font-medium text-[var(--accent-hi)] hover:underline sm:text-left"
        >
          {t("jobs.inbox.details")}
        </Link>
      </article>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border bg-[var(--surface-1)] p-4 shadow-sm transition-shadow hover:shadow-md",
        isNew ? "border-[var(--accent-ring)]" : "border-[var(--border-default)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/jobs/${job.id}`}
            className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--text-1)] hover:text-[var(--accent-hi)]"
          >
            {job.position}
          </Link>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--text-3)]">{job.company}</p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      <div className="flex flex-col gap-1 text-[11.5px] text-[var(--text-4)]">
        {job.location ? (
          <span className="flex min-w-0 items-start gap-1">
            <MapPinIcon size={11} className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">
              {job.location}
              {job.remote ? " · Remote" : ""}
            </span>
          </span>
        ) : null}
        {job.salaryRange ? <span className="break-words">{job.salaryRange}</span> : null}
        {job.deadline ? <span>{formatDate(job.deadline)}</span> : null}
        {job.source ? <span className="text-[var(--text-3)]">{job.source}</span> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2 pt-1 sm:flex-row sm:items-stretch">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-lg bg-[var(--accent-bg)] px-3 py-2.5 text-[12px] font-semibold text-[var(--accent-hi)] transition-colors hover:bg-[var(--accent-ring)] sm:flex-1"
        >
          {t("jobs.view")}
        </Link>
      </div>
    </div>
  );
}
