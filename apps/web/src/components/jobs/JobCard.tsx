import Link from "next/link";
import { CalendarDaysIcon, MapPinIcon } from "@/components/icons";
import type { Job } from "@/types/job";
import { JobStatusBadge } from "./JobStatusBadge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const isNew = job.status === "New";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-[var(--surface-1)] p-4 shadow-sm transition-shadow hover:shadow-md",
        isNew ? "border-[var(--accent-ring)]" : "border-[var(--border-default)]"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/jobs/${job.id}`} className="block truncate text-[14px] font-semibold text-[var(--text-1)] hover:text-[var(--accent-hi)]">
            {job.position}
          </Link>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-3)]">{job.company}</p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--text-4)]">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPinIcon size={11} />
            {job.location}
            {job.remote ? " · Remote" : ""}
          </span>
        )}
        {job.salaryRange && (
          <span>{job.salaryRange}</span>
        )}
        {job.deadline && (
          <span className="flex items-center gap-1">
            <CalendarDaysIcon size={11} />
            {formatDate(job.deadline)}
          </span>
        )}
        {job.source && (
          <span className="ml-auto truncate">{job.source}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-[var(--accent-bg)] px-3 py-2 text-[12px] font-semibold text-[var(--accent-hi)] transition-colors hover:bg-[var(--accent-ring)]"
        >
          View
        </Link>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border-default)] px-3 text-[12px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
          >
            Open job
          </a>
        )}
      </div>
    </div>
  );
}
