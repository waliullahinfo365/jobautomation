"use client";

import type { IntegrationListItem } from "@/types/integrations";
import {
  CalendarDaysIcon,
  HardDriveIcon,
  MailIcon,
} from "@/components/icons";
import { LinkedinIcon } from "@/components/icons/moreIcons";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";

const SIMPLE_DESC_KEY: Record<string, string> = {
  gmail: "settings.connectedAccounts.gmailDesc",
  "google-drive": "settings.connectedAccounts.driveDesc",
  "google-calendar": "settings.connectedAccounts.calendarDesc",
  linkedin: "settings.connectedAccounts.linkedinDesc",
};

function ProviderIcon({ slug }: { slug: string }) {
  switch (slug) {
    case "gmail":
      return <MailIcon size={22} className="text-[var(--accent-hi)]" />;
    case "google-drive":
      return <HardDriveIcon size={22} className="text-[var(--accent-hi)]" />;
    case "google-calendar":
      return <CalendarDaysIcon size={22} className="text-[var(--accent-hi)]" />;
    case "linkedin":
      return <LinkedinIcon size={22} className="text-[var(--accent-hi)]" />;
    default:
      return <MailIcon size={22} className="text-[var(--accent-hi)]" />;
  }
}

export function ConnectedAccountSimpleCard({
  item,
  onReconnect,
  loading,
}: {
  item: IntegrationListItem;
  onReconnect: () => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const account = item.connectedEmail ?? item.accountName;
  const descKey = SIMPLE_DESC_KEY[item.slug];
  const description = descKey ? t(descKey) : item.purpose;
  const needsReconnect = item.status !== "Connected";

  return (
    <article className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-bg)]">
          <ProviderIcon slug={item.slug} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-[var(--text-1)]">{item.provider}</h3>
            <ConnectionStatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-3)]">{description}</p>
          {account ? (
            <p className="mt-2 truncate text-[12px] text-[var(--text-4)]">{account}</p>
          ) : null}
        </div>
      </div>
      <Button
        type="button"
        variant={needsReconnect ? "default" : "outline"}
        size="lg"
        className="mt-4 min-h-[44px] w-full rounded-xl"
        disabled={loading}
        onClick={onReconnect}
      >
        {loading
          ? "…"
          : needsReconnect
            ? t("settings.connectedAccounts.connect")
            : t("labels.reconnect")}
      </Button>
    </article>
  );
}
