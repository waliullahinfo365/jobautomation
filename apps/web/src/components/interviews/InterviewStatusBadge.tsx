import { Badge } from "@/components/ui/badge";
import type { InterviewStatus } from "@/types/interview";

const styles: Record<InterviewStatus, string> = {
  Scheduled: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  "Awaiting Confirmation": "bg-[var(--amber-bg)] text-[var(--amber)]",
  Rescheduled: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Completed: "bg-[var(--surface-3)] text-[var(--text-2)]",
  Cancelled: "bg-[var(--rose-bg)] text-[var(--rose)]",
  "No Show": "bg-[var(--rose-bg)] text-[var(--rose)]",
};

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  return <Badge className={styles[status]}>{status}</Badge>;
}
