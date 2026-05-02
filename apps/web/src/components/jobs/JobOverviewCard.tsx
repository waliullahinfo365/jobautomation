import type { ReactNode } from "react";
import type { Job } from "@/types/job";
import { SectionCard } from "@/components/shared/SectionCard";
import { formatDate } from "@/lib/utils";
import { ExternalLinkIcon } from "@/components/icons";

interface JobOverviewCardProps {
  job: Job;
}

export function JobOverviewCard({ job }: JobOverviewCardProps) {
  return (
    <SectionCard title="Job Overview">
      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <OverviewItem label="Company" value={job.company} />
        <OverviewItem label="Position" value={job.position} />
        <OverviewItem label="Location" value={`${job.location}${job.remote ? " (Remote)" : ""}`} />
        <OverviewItem label="Source" value={job.source} />
        <OverviewItem
          label="Job URL"
          value={
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[var(--text-2)] hover:underline"
            >
              Open Posting <ExternalLinkIcon size={14} />
            </a>
          }
        />
        <OverviewItem label="Salary Range" value={job.salaryRange} />
        <OverviewItem label="Deadline" value={job.deadline ? formatDate(job.deadline) : "—"} />
        <OverviewItem label="Date Found" value={formatDate(job.dateFound)} />
        <OverviewItem label="Date Applied" value={job.dateApplied ? formatDate(job.dateApplied) : "—"} />
        <OverviewItem label="Contact Email" value={job.contactEmail ?? "—"} />
      </div>
    </SectionCard>
  );
}

function OverviewItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-medium text-[var(--text-1)]">{value}</p>
    </div>
  );
}
