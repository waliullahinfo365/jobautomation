import type { IntegrationStatus } from "@jobflow/shared/types/integration";
import { Badge } from "@/components/ui/badge";

const styles: Record<IntegrationStatus, string> = {
  Connected: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  "Not Connected": "bg-[var(--surface-3)] text-[var(--text-2)]",
  "Needs Attention": "bg-[var(--amber-bg)] text-[var(--amber)]",
  Expired: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Disabled: "bg-[var(--surface-3)] text-[var(--text-3)]",
};

export function ConnectionStatusBadge({ status }: { status: IntegrationStatus }) {
  return <Badge className={styles[status]}>{status}</Badge>;
}
