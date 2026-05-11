"use client";

import type { ContactRelatedJob } from "@/types/contact";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { jobPipelineStatusDisplayLabel } from "@/i18n/job-filters";

export function ContactRelatedJobs({ jobs }: { jobs: ContactRelatedJob[] }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div key={job.id} className="rounded-lg border border-border bg-card/40 p-3">
          <p className="text-sm font-medium text-foreground">{job.company}</p>
          <p className="text-xs text-muted-foreground">{job.position}</p>
          <div className="mt-1 flex items-center justify-between">
            <Badge variant="default">{jobPipelineStatusDisplayLabel(job.status, t)}</Badge>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
              {t("contacts.relatedJobs.viewJob")}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
