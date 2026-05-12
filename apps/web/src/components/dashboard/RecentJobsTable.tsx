"use client";

import Link from "next/link";
import type { JobSummary } from "@/types/job";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { isOverdue } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";

interface RecentJobsTableProps {
  jobs: JobSummary[];
}

function getPriorityKey(job: JobSummary): "high" | "medium" | "low" {
  if (job.status === "Offer" || job.status === "Interview") return "high";
  if (job.deadline && isOverdue(job.deadline)) return "high";
  if (job.status === "Ready to Apply" || job.status === "Applied") return "medium";
  return "low";
}

function priorityVariant(key: "high" | "medium" | "low"): "default" | "warning" | "danger" {
  if (key === "high") return "danger";
  if (key === "medium") return "warning";
  return "default";
}

export function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";

  function fmtDate(d: string | Date) {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return "—";
    return new Intl.DateTimeFormat(bcp47, { day: "numeric", month: "long", year: "numeric" }).format(dt);
  }

  return (
    <Card className="hover-lift overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t("dashboard.recentJobs.title")}</CardTitle>
        <Link href="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          {t("dashboard.recentJobs.viewAll")}
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard.recentJobs.company")}</TableHead>
              <TableHead>{t("dashboard.recentJobs.position")}</TableHead>
              <TableHead>{t("dashboard.recentJobs.source")}</TableHead>
              <TableHead>{t("dashboard.recentJobs.status")}</TableHead>
              <TableHead>{t("dashboard.recentJobs.priority")}</TableHead>
              <TableHead>{t("dashboard.recentJobs.deadline")}</TableHead>
              <TableHead>{t("dashboard.recentJobs.lastUpdated")}</TableHead>
              <TableHead className="text-right">{t("dashboard.recentJobs.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const pKey = getPriorityKey(job);
              return (
                <TableRow key={job._id}>
                  <TableCell className="font-medium text-foreground">{job.company}</TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell className="text-muted-foreground">{job.source}</TableCell>
                  <TableCell><JobStatusBadge status={job.status} /></TableCell>
                  <TableCell>
                    <Badge variant={priorityVariant(pKey)}>{t(`dashboard.priority.${pKey}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{job.deadline ? fmtDate(job.deadline) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(job.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/jobs/${job._id}`}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      {t("dashboard.recentJobs.view")}
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
