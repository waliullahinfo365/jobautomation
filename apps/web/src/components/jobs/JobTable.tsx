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
import { showInfo } from "@/lib/ui/toast";

interface JobTableProps {
  jobs: Job[];
  onArchive?: (id: string) => void;
  onGenerateResearch?: (id: string) => void;
  onGenerateDraft?: (id: string) => void;
}

export function JobTable({ jobs, onArchive, onGenerateResearch, onGenerateDraft }: JobTableProps) {
  return (
    <SectionCard title="Opportunities" description="Track each role with status, priority, and automation context." contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Salary Range</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Date Found</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.company}</TableCell>
              <TableCell>
                <Link href={`/jobs/${job.id}`} className="hover:text-primary">
                  {job.position}
                </Link>
              </TableCell>
              <TableCell><Badge variant="outline">{job.source}</Badge></TableCell>
              <TableCell><JobStatusBadge status={job.status} /></TableCell>
              <TableCell><JobPriorityBadge priority={job.priority} /></TableCell>
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
                    View
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreIcon size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {onGenerateResearch && (
                        <DropdownMenuItem onClick={() => onGenerateResearch(job.id)}>
                          Generate Research
                        </DropdownMenuItem>
                      )}
                      {onGenerateDraft && (
                        <DropdownMenuItem onClick={() => onGenerateDraft(job.id)}>
                          Generate Draft
                        </DropdownMenuItem>
                      )}
                      {onArchive && (
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-600"
                          onClick={() => onArchive(job.id)}
                        >
                          Archive
                        </DropdownMenuItem>
                      )}
                      {!onArchive && !onGenerateResearch && !onGenerateDraft && (
                        <>
                          <DropdownMenuItem onClick={() => showInfo("Edit action is available in job detail.")}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => showInfo("Archive action is available in job detail.")}>
                            Archive
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
