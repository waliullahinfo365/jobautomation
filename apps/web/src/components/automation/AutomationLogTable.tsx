import type { AutomationLog } from "@/types/automation";
import { AutomationLogsTable } from "./AutomationLogsTable";

interface AutomationLogTableProps {
  logs: AutomationLog[];
}

export function AutomationLogTable({ logs }: AutomationLogTableProps) {
  return <AutomationLogsTable logs={logs} />;
}
