import type { JobAutomationLog } from "@/types/job";
import { SectionCard } from "@/components/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface JobAutomationActivityProps {
  logs: JobAutomationLog[];
}

const toneMap: Record<JobAutomationLog["status"], "success" | "warning" | "danger"> = {
  success: "success",
  warning: "warning",
  error: "danger",
};

export function JobAutomationActivity({ logs }: JobAutomationActivityProps) {
  return (
    <SectionCard title="Automation Activity">
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border border-[var(--border-default)] p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text-1)]">{log.event}</p>
              <Badge variant={toneMap[log.status]}>{log.status}</Badge>
            </div>
            <p className="text-xs text-[var(--text-3)]">{log.detail}</p>
            <p className="mt-1 text-xs text-[var(--text-4)]">{formatDate(log.timestamp, "MMM d, yyyy HH:mm")}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
