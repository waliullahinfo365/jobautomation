import Link from "next/link";
import { CalendarDaysIcon, MapPinIcon } from "@/components/icons";
import type { Job } from "@/types/job";
import { JobStatusBadge } from "./JobStatusBadge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { resolveExternalJobPostingUrl } from "@/lib/utils/job-posting-url";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const isNew = job.status === "New";
  const externalUrl = resolveExternalJobPostingUrl(job);

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
        {job.deadline ? (
          <span className="flex items-center gap-1">
            <CalendarDaysIcon size={11} />
            {formatDate(job.deadline)}
          </span>
        ) : null}
        {job.source ? <span className="text-[var(--text-3)]">{job.source}</span> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2 pt-1 sm:flex-row sm:items-stretch">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-lg bg-[var(--accent-bg)] px-3 py-2.5 text-[12px] font-semibold text-[var(--accent-hi)] transition-colors hover:bg-[var(--accent-ring)] sm:flex-1"
        >
          View
        </Link>
        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-lg border border-[var(--border-default)] px-3 py-2.5 text-center text-[12px] font-medium leading-tight text-[var(--text-2)] hover:bg-[var(--surface-3)] sm:w-auto sm:shrink-0"
          >
            Open job
          </a>
        ) : null}
      </div>
    </div>
  );
}
