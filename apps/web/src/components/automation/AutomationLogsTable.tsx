import type { AutomationLog } from "@/types/automation";
import { showInfo } from "@/lib/ui/toast";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function AutomationLogsTable({ logs }: { logs: AutomationLog[] }) {
  return (
    <SectionCard
      title="Recent Automation Logs"
      description="Latest automation executions across modules."
      contentClassName="p-0"
    >
      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Related Record</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{formatDate(log.createdAt, "MMM d, HH:mm")}</TableCell>
              <TableCell className="font-medium">{log.moduleName}</TableCell>
              <TableCell>
                <Badge variant={log.status === "Success" ? "success" : log.status === "Warning" ? "warning" : "danger"}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-sm truncate text-muted-foreground">{log.message}</TableCell>
              <TableCell>{log.relatedRecord}</TableCell>
              <TableCell>{log.duration}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() =>
                    showInfo("Detailed log drill-down will be available with the observability integration.")
                  }
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </SectionCard>
  );
}
