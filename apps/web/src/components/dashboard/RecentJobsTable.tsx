"use client";

import Link from "next/link";
import type { JobSummary } from "@/types/job";
import type { JobStatus } from "@/types/job";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { isOverdue } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { jobFilterSourceLabel, jobFilterStatusLabel } from "@/i18n/job-filters";
import type { JobFilters } from "@/types/job";
import { formatDateLongLocale } from "@/lib/format-date-locale";

interface RecentJobsTableProps {
  jobs: JobSummary[];
}

function getPriorityKey(job: JobSummary): "high" | "medium" | "low" {
  if (job.status === "Offer" || job.status === "Interview") return "high";
  if (job.deadline && isOverdue(job.deadline)) return "high";
  if (job.status === "Ready to Apply" || job.status === "Applied") return "medium";
  return "low";
}

function priorityBadge(priorityKey: "high" | "medium" | "low"): "default" | "warning" | "danger" {
  if (priorityKey === "high") return "danger";
  if (priorityKey === "medium") return "warning";
  return "default";
}

export function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  const { t, locale } = useTranslation();

  return (
    <Card className="hover-lift overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t("dashboard.opportunities.title")}</CardTitle>
        <Link href="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          {t("dashboard.opportunities.viewAll")}
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.opportunities.company")}</TableHead>
                <TableHead>{t("dashboard.opportunities.position")}</TableHead>
                <TableHead>{t("dashboard.opportunities.source")}</TableHead>
                <TableHead>{t("dashboard.opportunities.status")}</TableHead>
                <TableHead>{t("dashboard.opportunities.priority")}</TableHead>
                <TableHead>{t("dashboard.opportunities.deadline")}</TableHead>
                <TableHead>{t("dashboard.opportunities.lastUpdated")}</TableHead>
                <TableHead className="text-right">{t("dashboard.opportunities.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const priorityKey = getPriorityKey(job);
                const statusLabel = jobFilterStatusLabel(job.status as JobFilters["status"], t);
                const sourceLabel = jobFilterSourceLabel(job.source as JobFilters["source"], t);
                const priorityLabel = t(`dashboard.priority.${priorityKey}`);
                return (
                  <TableRow key={job._id}>
                    <TableCell className="font-medium text-foreground">{job.company}</TableCell>
                    <TableCell>{job.title}</TableCell>
                    <TableCell className="text-muted-foreground">{sourceLabel}</TableCell>
                    <TableCell>
                      <JobStatusBadge status={job.status as JobStatus} label={statusLabel} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityBadge(priorityKey) as "default" | "warning" | "danger"}>
                        {priorityLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {job.deadline ? formatDateLongLocale(job.deadline, locale) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateLongLocale(job.updatedAt, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/jobs/${job._id}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-accent"
                      >
                        {t("dashboard.opportunities.view")}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
