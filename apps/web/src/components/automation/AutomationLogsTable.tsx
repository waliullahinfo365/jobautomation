"use client";

import { useState } from "react";
import type { AutomationLog } from "@/types/automation";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { friendlyAutomationLogMessage } from "@/lib/automationLogMessaging";
import { AutomationLogDetailModal } from "./AutomationLogDetailModal";

export function AutomationLogsTable({ logs }: { logs: AutomationLog[] }) {
  const [detailLog, setDetailLog] = useState<AutomationLog | null>(null);

  return (
    <>
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
              {logs.map((log) => {
                const displayMessage = friendlyAutomationLogMessage(log.technicalMessage ?? log.message);
                return (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt, "MMM d, HH:mm")}</TableCell>
                    <TableCell className="font-medium">{log.moduleName}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "Success" ? "success" : log.status === "Warning" ? "warning" : "danger"}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">{displayMessage}</TableCell>
                    <TableCell>{log.relatedRecord}</TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" type="button" onClick={() => setDetailLog(log)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <AutomationLogDetailModal log={detailLog} open={detailLog !== null} onClose={() => setDetailLog(null)} />
    </>
  );
}
