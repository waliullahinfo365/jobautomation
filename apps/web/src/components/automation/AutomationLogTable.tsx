import type { AutomationLog } from "@/types/automation";
import { AutomationLogsTable, type AutomationLogsTableVariant } from "./AutomationLogsTable";

interface AutomationLogTableProps {
  logs: AutomationLog[];
  variant?: AutomationLogsTableVariant;
}

export function AutomationLogTable({ logs, variant = "automation" }: AutomationLogTableProps) {
  return <AutomationLogsTable logs={logs} variant={variant} />;
}
