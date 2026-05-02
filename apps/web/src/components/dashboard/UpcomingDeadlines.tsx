import Link from "next/link";
import { ArrowRightIcon, DeadlineIcon } from "@/components/icons";
import type { JobSummary } from "@/types/job";
import { formatDate, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UpcomingDeadlinesProps {
  jobs: JobSummary[];
}

function getUrgency(deadline: string | Date, now: Date): "Today" | "Tomorrow" | "This Week" | "Later" {
  const d = new Date(deadline);
  const ms = d.getTime() - now.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return "This Week";
  return "Later";
}

function deadlineParts(deadline: string | Date) {
  const dt = new Date(deadline);
  return {
    m: dt.toLocaleString("en-US", { month: "short" }),
    d: String(dt.getDate()).padStart(2, "0"),
  };
}

export function UpcomingDeadlines({ jobs }: UpcomingDeadlinesProps) {
  const withDeadlines = jobs.filter((j) => j.deadline);
  const now = new Date();

  return (
    <article className="jf-panel flex min-h-[280px] min-w-0 flex-col sm:min-h-[320px]">
      <div className="jf-panel-head">
        <div className="jf-panel-title-wrap">
          <div className="jf-panel-title-icon">
            <DeadlineIcon size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="jf-panel-title">Upcoming Deadlines</h3>
            <p className="jf-panel-sub">Time-sensitive applications and interviews</p>
          </div>
        </div>
      </div>

      {withDeadlines.length === 0 ? (
        <div className="jf-empty mt-1 flex flex-1 flex-col justify-center">
          <div className="jf-empty-icon">
            <DeadlineIcon size={22} />
          </div>
          <div className="jf-empty-title">You&apos;re all clear</div>
          <p className="jf-empty-sub">
            No deadlines on the horizon. We&apos;ll surface them here the moment something needs your attention.
          </p>
          <Link href="/settings" className="jf-empty-cta">
            Configure reminders
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      ) : (
        <div className="jf-deadlines">
          {withDeadlines.map((job) => {
            const overdue = job.deadline ? isOverdue(job.deadline) : false;
            const urgency = job.deadline ? getUrgency(job.deadline, now) : "Later";
            const parts = job.deadline ? deadlineParts(job.deadline) : { m: "—", d: "—" };

            const tagClass =
              overdue || urgency === "Today"
                ? "jf-dl-tag--urgent"
                : urgency === "Tomorrow" || urgency === "This Week"
                  ? "jf-dl-tag--soon"
                  : "jf-dl-tag--later";

            const tagLabel = overdue
              ? "Urgent"
              : urgency === "Today"
                ? "Today"
                : urgency === "Tomorrow" || urgency === "This Week"
                  ? "Soon"
                  : "On track";

            return (
              <Link key={job._id} href={`/jobs/${job._id}`} className="jf-dl-row">
                <div className="jf-dl-date">
                  <span className="jf-dl-date-m">{parts.m}</span>
                  <span className="jf-dl-date-d">{parts.d}</span>
                </div>
                <div className="jf-dl-body">
                  <div className="jf-dl-title">{job.title}</div>
                  <div className="jf-dl-meta">
                    {job.company}
                    {job.deadline ? ` · ${formatDate(job.deadline)}` : ""}
                    {overdue ? " · Overdue" : ""}
                  </div>
                </div>
                <span className={cn("jf-dl-tag", tagClass)}>{tagLabel}</span>
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
}
