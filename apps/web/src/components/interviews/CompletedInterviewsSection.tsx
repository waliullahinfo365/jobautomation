import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { CompletedInterview } from "@/types/interview";

export function CompletedInterviewsSection({ interviews }: { interviews: CompletedInterview[] }) {
  return (
    <SectionCard title="Completed Interviews" description="Track outcomes and follow-up status." contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Interview Type</TableHead>
            <TableHead>Completed Date</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Notes Summary</TableHead>
            <TableHead>Follow-up Sent</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interviews.map((iv) => (
            <TableRow key={iv.id}>
              <TableCell className="font-medium">{iv.company}</TableCell>
              <TableCell>{iv.position}</TableCell>
              <TableCell>{iv.interviewType}</TableCell>
              <TableCell>{formatDate(iv.completedDate, "MMM d, yyyy")}</TableCell>
              <TableCell>{iv.outcome}</TableCell>
              <TableCell className="max-w-[280px] truncate">{iv.notesSummary}</TableCell>
              <TableCell>{iv.followUpSent ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right"><Button size="sm" variant="ghost">View Notes</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
