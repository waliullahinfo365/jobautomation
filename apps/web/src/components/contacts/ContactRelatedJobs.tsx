import type { ContactRelatedJob } from "@/types/contact";
import { Badge } from "@/components/ui/badge";

export function ContactRelatedJobs({ jobs }: { jobs: ContactRelatedJob[] }) {
  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div key={job.id} className="rounded-lg border border-border bg-card/40 p-3">
          <p className="text-sm font-medium text-foreground">{job.company}</p>
          <p className="text-xs text-muted-foreground">{job.position}</p>
          <div className="mt-1 flex items-center justify-between">
            <Badge variant="default">{job.status}</Badge>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground hover:underline">View Job</a>
          </div>
        </div>
      ))}
    </div>
  );
}
