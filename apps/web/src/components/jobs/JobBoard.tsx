import { formatDate } from "@/lib/utils";
import type { Job, JobStatus } from "@/types/job";
import { JobCard } from "./JobCard";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUSES: JobStatus[] = [
  "New",
  "Research",
  "Drafting",
  "Ready to Apply",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
];

interface JobBoardProps {
  jobs: Job[];
}

export function JobBoard({ jobs }: JobBoardProps) {
  return (
    <ScrollArea className="w-full">
      <div className="grid min-w-[1200px] grid-cols-8 gap-4">
        {STATUSES.map((status) => {
          const statusJobs = jobs.filter((job) => job.status === status);
          return (
            <div key={status} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-1)]">{status}</h3>
                <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs text-[var(--text-2)]">{statusJobs.length}</span>
              </div>
              <div className="space-y-3">
                {statusJobs.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--border-default)] px-2 py-4 text-center text-xs text-[var(--text-4)]">
                    No jobs
                  </p>
                ) : (
                  statusJobs.map((job, idx) => (
                    <div
                      key={job.id ? job.id : `job-${status}-${idx}`}
                      className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3"
                    >
                      <JobCard job={job} />
                      <p className="mt-2 text-[11px] text-[var(--text-3)]">Last updated: {formatDate(job.lastUpdated)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
