import type { ApplicationAutomationLog } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const toneMap: Record<ApplicationAutomationLog["status"], "success" | "warning" | "danger"> = {
  success: "success",
  warning: "warning",
  error: "danger",
};

export function ApplicationAutomationLog({ logs }: { logs: ApplicationAutomationLog[] }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border border-[var(--border-default)] p-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[var(--text-1)]">{log.engine}</p>
            <Badge variant={toneMap[log.status]}>{log.status}</Badge>
          </div>
          <p className="text-xs font-medium text-[var(--text-2)]">{log.event}</p>
          <p className="text-xs text-[var(--text-3)]">{log.detail}</p>
          <p className="mt-1 text-xs text-[var(--text-4)]">{formatDate(log.timestamp, "MMM d, yyyy HH:mm")}</p>
        </div>
      ))}
    </div>
  );
}

export const ApplicationAutomationLogList = ApplicationAutomationLog;
