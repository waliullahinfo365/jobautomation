import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Job } from "@/types/job";
import { JobStatusBadge } from "./JobStatusBadge";
import { JobPriorityBadge } from "./JobPriorityBadge";

interface JobDetailHeaderProps {
  job: Job;
  /** Optional custom action bar. When provided, replaces the default placeholder buttons. */
  renderActions?: ReactNode;
}

export function JobDetailHeader({ job, renderActions }: JobDetailHeaderProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-[var(--text-3)]">{job.company}</p>
          <h1 className="text-2xl font-semibold text-[var(--text-1)]">{job.position}</h1>
          <div className="mt-2 flex items-center gap-2">
            <JobStatusBadge status={job.status} />
            <JobPriorityBadge priority={job.priority} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {renderActions ?? (
            <>
              <Button variant="outline">Edit Job</Button>
              <Button variant="secondary">Generate Draft</Button>
              <Button>Mark Applied</Button>
              <Button variant="outline">Archive</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
