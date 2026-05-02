import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { InterviewAutomationLog } from "@/types/interview";
import { formatDate } from "@/lib/utils";

export function InterviewAutomationLogs({ logs }: { logs: InterviewAutomationLog[] }) {
  return (
    <SectionCard title="Automation Logs" description="Scheduling and reminder activity logs." contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Related Interview</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{formatDate(log.time, "MMM d, HH:mm:ss")}</TableCell>
              <TableCell>{log.module}</TableCell>
              <TableCell>
                <Badge variant={log.status === "success" ? "success" : log.status === "warning" ? "warning" : "danger"}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[360px] truncate">{log.message}</TableCell>
              <TableCell>{log.relatedInterview}</TableCell>
              <TableCell>{log.durationMs} ms</TableCell>
              <TableCell className="text-right"><Button size="sm" variant="ghost">View</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
