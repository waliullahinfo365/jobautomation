"use client";

import Link from "next/link";
import type { Job } from "@/types/job";
import { JobStatusBadge } from "./JobStatusBadge";
import { JobPriorityBadge } from "./JobPriorityBadge";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionCard } from "@/components/shared/SectionCard";
import { MoreIcon } from "@/components/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { resolveExternalJobPostingUrl } from "@/lib/utils/job-posting-url";

interface JobTableProps {
  jobs: Job[];
  onArchive?: (id: string) => void;
  onGenerateResearch?: (id: string) => void;
  onGenerateDraft?: (id: string) => void;
}

export function JobTable({ jobs, onArchive, onGenerateResearch, onGenerateDraft }: JobTableProps) {
  const { t } = useTranslation();

  return (
    <SectionCard title={t("jobs.opportunities")} description={t("jobs.opportunitiesDesc")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("jobs.company")}</TableHead>
            <TableHead>{t("jobs.position")}</TableHead>
            <TableHead>{t("jobs.source")}</TableHead>
            <TableHead>{t("jobs.status")}</TableHead>
            <TableHead>{t("jobs.priority")}</TableHead>
            <TableHead>{t("jobs.salaryRange")}</TableHead>
            <TableHead>{t("jobs.deadline")}</TableHead>
            <TableHead>{t("jobs.dateFound")}</TableHead>
            <TableHead>{t("jobs.lastUpdated")}</TableHead>
            <TableHead className="text-right">{t("jobs.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job, index) => {
            const postingHref = resolveExternalJobPostingUrl(job);
            return (
            <TableRow key={job.id ? job.id : `job-${index}`}>
              <TableCell className="font-medium">{job.company}</TableCell>
              <TableCell>
                <Link href={`/jobs/${job.id}`} className="hover:text-primary">
                  {job.position}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{job.source}</Badge>
              </TableCell>
              <TableCell>
                <JobStatusBadge status={job.status} />
              </TableCell>
              <TableCell>
                <JobPriorityBadge priority={job.priority} />
              </TableCell>
              <TableCell>{job.salaryRange}</TableCell>
              <TableCell>{job.deadline ? formatDate(job.deadline) : "—"}</TableCell>
              <TableCell>{formatDate(job.dateFound)}</TableCell>
              <TableCell>{formatDate(job.lastUpdated)}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex h-8 items-center rounded-[var(--r-sm)] border border-[var(--border-default)] px-3 text-xs font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                  >
                    {t("jobs.view")}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreIcon size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {postingHref ? (
                          <DropdownMenuItem
                            onClick={() => {
                              window.open(postingHref, "_blank", "noopener,noreferrer");
                            }}
                          >
                            {t("jobs.jobLink")}
                          </DropdownMenuItem>
                        ) : null}
                      {onGenerateResearch && (
                        <DropdownMenuItem onClick={() => onGenerateResearch(job.id)}>
                          {t("jobs.generateResearch")}
                        </DropdownMenuItem>
                      )}
                      {onGenerateDraft && (
                        <DropdownMenuItem onClick={() => onGenerateDraft(job.id)}>{t("jobs.generateDraft")}</DropdownMenuItem>
                      )}
                      {onArchive && (
                        <DropdownMenuItem onClick={() => onArchive(job.id)}>{t("jobs.archive")}</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
