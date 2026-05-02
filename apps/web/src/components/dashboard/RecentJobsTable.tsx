import Link from "next/link";
import type { JobSummary } from "@/types/job";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { formatDate, isOverdue } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RecentJobsTableProps {
  jobs: JobSummary[];
}

function getPriority(job: JobSummary): "High" | "Medium" | "Low" {
  if (job.status === "Offer" || job.status === "Interview") return "High";
  if (job.deadline && isOverdue(job.deadline)) return "High";
  if (job.status === "Ready to Apply" || job.status === "Applied") return "Medium";
  return "Low";
}

function priorityBadge(priority: "High" | "Medium" | "Low"): string {
  if (priority === "High") return "danger";
  if (priority === "Medium") return "warning";
  return "default";
}

export function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  return (
    <Card className="hover-lift overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Job Opportunities</CardTitle>
        <Link href="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const priority = getPriority(job);
              return (
                <TableRow key={job._id}>
                  <TableCell className="font-medium text-foreground">{job.company}</TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell className="text-muted-foreground">{job.source}</TableCell>
                  <TableCell><JobStatusBadge status={job.status} /></TableCell>
                  <TableCell>
                    <Badge variant={priorityBadge(priority) as "default" | "warning" | "danger"}>{priority}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{job.deadline ? formatDate(job.deadline) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(job.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/jobs/${job._id}`}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      View
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
