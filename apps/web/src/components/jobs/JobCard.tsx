import Link from "next/link";
import { CalendarDaysIcon, ExternalLinkIcon, MapPinIcon } from "@/components/icons";
import type { Job } from "@/types/job";
import { JobStatusBadge } from "./JobStatusBadge";
import { JobPriorityBadge } from "./JobPriorityBadge";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Card className="hover:shadow-[var(--shadow-pop)] transition-[box-shadow] duration-[var(--dur-fast)] [transition-timing-function:var(--ease)]">
      <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/jobs/${job.id}`} className="font-semibold text-sm hover:text-primary truncate block">
            {job.position}
          </Link>
          <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>
        </div>
        <div className="flex items-center gap-2">
          <JobPriorityBadge priority={job.priority} />
          <JobStatusBadge status={job.status} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPinIcon size={12} /> {job.location}
            {job.remote && " · Remote"}
          </span>
        )}
        {job.deadline && (
          <span className="flex items-center gap-1">
            <CalendarDaysIcon size={12} /> {formatDate(job.deadline)}
          </span>
        )}
        {job.source && <span className="ml-auto">{job.source}</span>}
      </div>

      <div className="mt-3">
        <Badge variant="outline">{job.source}</Badge>
      </div>

      {job.url && (
        <div className="mt-3 flex justify-end">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View posting <ExternalLinkIcon size={12} />
          </a>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
