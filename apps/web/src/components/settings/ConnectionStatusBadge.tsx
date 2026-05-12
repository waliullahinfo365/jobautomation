import type { IntegrationStatus } from "@/types/integrations";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/I18nProvider";

const styles: Record<IntegrationStatus, string> = {
  Connected: "bg-[var(--emerald-bg)] text-[var(--emerald)]",
  "Not Connected": "bg-[var(--surface-3)] text-[var(--text-2)]",
  "Needs Attention": "bg-[var(--amber-bg)] text-[var(--amber)]",
  Expired: "bg-[var(--amber-bg)] text-[var(--amber)]",
  Disabled: "bg-[var(--surface-3)] text-[var(--text-3)]",
};

const STATUS_KEY: Record<IntegrationStatus, string> = {
  Connected: "integrations.status.connected",
  "Not Connected": "integrations.status.notConnected",
  "Needs Attention": "integrations.status.needsAttention",
  Expired: "integrations.expiredDisabled",
  Disabled: "integrations.status.disabled",
};

export function ConnectionStatusBadge({ status }: { status: IntegrationStatus }) {
  const { t } = useTranslation();
  return <Badge className={styles[status]}>{STATUS_KEY[status] ? t(STATUS_KEY[status]) : status}</Badge>;
}
