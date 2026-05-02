import type { ContactAutomationLog } from "@/types/contact";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function ContactAutomationActivity({ logs }: { logs: ContactAutomationLog[] }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border border-border bg-card/40 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{log.module}</p>
            <Badge variant={log.status === "success" ? "success" : log.status === "warning" ? "warning" : "danger"}>
              {log.status}
            </Badge>
          </div>
          <p className="text-xs font-medium text-foreground">{log.event}</p>
          <p className="text-xs text-muted-foreground">{log.detail}</p>
          <p className="mt-1 text-xs text-muted-foreground/80">{formatDate(log.timestamp, "MMM d, yyyy HH:mm")}</p>
        </div>
      ))}
    </div>
  );
}
