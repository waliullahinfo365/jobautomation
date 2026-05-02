"use client";

import type { IntegrationListItem } from "@/types/integrations";
import {
  BotIcon,
  CalendarDaysIcon,
  DatabaseIcon,
  HardDriveIcon,
  MailIcon,
  MessageSquareIcon,
  SendIcon,
  SparklesIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";

type Pending = { slug: string; action: "connect" | "test" | "disconnect" } | null | undefined;

function formatWhen(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function isBusy(pending: Pending, slug: string, action: "connect" | "test" | "disconnect"): boolean {
  return pending?.slug === slug && pending.action === action;
}

function ProviderIcon({ slug }: { slug: string }) {
  const iconClass = "shrink-0 text-muted-foreground";
  switch (slug) {
    case "gmail":
      return <MailIcon size={32} className={iconClass} aria-hidden />;
    case "google-drive":
      return <HardDriveIcon size={32} className={iconClass} aria-hidden />;
    case "google-calendar":
      return <CalendarDaysIcon size={32} className={iconClass} aria-hidden />;
    case "openai":
      return <SparklesIcon size={32} className={iconClass} aria-hidden />;
    case "claude":
      return <BotIcon size={32} className={iconClass} aria-hidden />;
    case "smtp":
      return <SendIcon size={32} className={iconClass} aria-hidden />;
    case "notion-legacy":
      return <DatabaseIcon size={32} className={iconClass} aria-hidden />;
    case "slack":
      return <MessageSquareIcon size={32} className={iconClass} aria-hidden />;
    default:
      return <DatabaseIcon size={32} className={iconClass} aria-hidden />;
  }
}

type Props = {
  item: IntegrationListItem;
  onConnect: () => void;
  onTest: () => void;
  onDisconnect: () => void;
  pending?: Pending;
};

export function IntegrationCard({ item, onConnect, onTest, onDisconnect, pending }: Props) {
  const connectLabel = item.status === "Not Connected" ? "Connect" : "Reconnect";
  const account =
    item.connectedEmail ?? item.accountName ?? (item.metadata?.workspaceName as string | undefined) ?? undefined;
  const modelPreview = item.metadata?.model as string | undefined;
  const apiPreview = item.metadata?.apiKeyPreview as string | undefined;
  const lastSync = formatWhen(item.lastSyncAt);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <ProviderIcon slug={item.slug} />
            <div>
              <CardTitle className="text-base">{item.provider}</CardTitle>
              <CardDescription className="mt-1">{item.purpose}</CardDescription>
            </div>
          </div>
          <ConnectionStatusBadge status={item.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Field label="Required for" value={item.requiredFor.length ? item.requiredFor.join(", ") : "—"} />
        <Field
          label="Connected account"
          value={account ?? "—"}
        />
        {lastSync ? <Field label="Last sync" value={lastSync} /> : null}
        {item.syncStatus ? <Field label="Sync status" value={item.syncStatus} /> : null}
        {item.errorMessage ? <Field label="Error" value={item.errorMessage} /> : null}
        {item.scopes?.length ? <Field label="Scopes" value={item.scopes.join(", ")} /> : null}
        {modelPreview ? <Field label="Model" value={modelPreview} /> : null}
        {apiPreview ? <Field label="API key" value={apiPreview} /> : null}
        {item.lastTest ? (
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <p className="font-medium text-muted-foreground">Last test</p>
            <p className="mt-1">
              <span className="font-semibold">{item.lastTest.status}</span>
              {" · "}
              {item.lastTest.message}
            </p>
            <p className="mt-1 text-muted-foreground">{formatWhen(item.lastTest.checkedAt)}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="default" size="sm" onClick={onConnect} disabled={isBusy(pending, item.slug, "connect")}>
            {connectLabel}
          </Button>
          <Button variant="secondary" size="sm" onClick={onTest} disabled={isBusy(pending, item.slug, "test")}>
            Test
          </Button>
          <Button variant="outline" size="sm" onClick={onDisconnect} disabled={isBusy(pending, item.slug, "disconnect")}>
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
