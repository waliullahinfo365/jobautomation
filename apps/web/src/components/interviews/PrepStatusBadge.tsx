import { Badge } from "@/components/ui/badge";
import type { PrepStatus, PrepTaskStatus } from "@/types/interview";

const styles: Record<PrepStatus | PrepTaskStatus, string> = {
  "Not Started": "bg-[var(--surface-3)] text-[var(--text-2)]",
  "In Progress": "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Ready: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  Overdue: "bg-[var(--rose-bg)] text-[var(--rose)]",
  Done: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
};

export function PrepStatusBadge({ status }: { status: PrepStatus | PrepTaskStatus }) {
  return <Badge className={styles[status]}>{status}</Badge>;
}
