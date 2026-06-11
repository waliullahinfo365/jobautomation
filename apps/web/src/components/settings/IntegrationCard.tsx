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
} from "@/components/icons";
import { LinkedinIcon } from "@/components/icons/moreIcons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { useTranslation } from "@/i18n/I18nProvider";

type Pending = { slug: string; action: "connect" | "test" | "disconnect" } | null | undefined;

const PROVIDER_DESC_KEY: Record<string, string> = {
  gmail: "integrations.providers.gmail.description",
  "google-drive": "integrations.providers.googleDrive.description",
  "google-calendar": "integrations.providers.googleCalendar.description",
  telegram: "integrations.providers.telegram.description",
  linkedin: "integrations.providers.linkedin.description",
  claude: "integrations.providers.claude.description",
  smtp: "integrations.providers.smtp.description",
  resend: "integrations.providers.resend.description",
  "notion-legacy": "integrations.providers.notionLegacy.description",
  slack: "integrations.providers.slack.description",
};

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
    case "linkedin":
      return <LinkedinIcon size={32} className={iconClass} aria-hidden />;
    case "claude":
      return <BotIcon size={32} className={iconClass} aria-hidden />;
    case "smtp":
      return <SendIcon size={32} className={iconClass} aria-hidden />;
    case "resend":
      return <MailIcon size={32} className={iconClass} aria-hidden />;
    case "notion-legacy":
      return <DatabaseIcon size={32} className={iconClass} aria-hidden />;
    case "slack":
    case "telegram":
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
  const { t, locale } = useTranslation();
  const fmtWhen = (iso?: string) => {
    if (!iso) return undefined;
    try {
      return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
        dateStyle: "medium", timeStyle: "short",
      }).format(new Date(iso));
    } catch { return iso; }
  };
  const bool = (v: boolean) => v ? t("integrations.status.yes") : t("integrations.status.no");

  const isGoogle = item.slug === "gmail" || item.slug === "google-drive" || item.slug === "google-calendar";
  const demoGoogle =
    isGoogle &&
    (item.metadata?.demoConnection === true ||
      item.metadata?.stub === true ||
      item.connectedEmail === "oauth-demo-user@example.com");
  const isSlack = item.slug === "slack";
  const isResend = item.slug === "resend";
  const isLinkedin = item.slug === "linkedin";
  const connectLabel =
    isLinkedin
      ? t("integrations.actions.linkedinSetup")
    : isResend
      ? t("integrations.actions.configureInstructions")
      : demoGoogle
        ? t("integrations.actions.configureGoogleOAuth")
        : item.status === "Not Connected"
          ? t("integrations.actions.connect")
          : t("integrations.actions.reconnect");
  const isTelegram = item.slug === "telegram";
  const account =
    item.connectedEmail ?? item.accountName ?? (item.metadata?.workspaceName as string | undefined) ?? undefined;
  const modelPreview = item.metadata?.model as string | undefined;
  const apiPreview = item.metadata?.apiKeyPreview as string | undefined;
  const lastSync = fmtWhen(item.lastSyncAt);
  const descKey = PROVIDER_DESC_KEY[item.slug];
  const description = descKey ? t(descKey) : item.purpose;

  const TEST_STATUS_KEY: Record<string, string> = {
    Success: "integrations.status.success",
    Failed: "integrations.status.failed",
    Warning: "integrations.status.warning",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <ProviderIcon slug={item.slug} />
            <div>
              <CardTitle className="text-base">{item.provider}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <ConnectionStatusBadge status={item.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Field label={t("integrations.requiredFor")} value={item.requiredFor.length ? item.requiredFor.join(", ") : "—"} />
        <Field label={t("integrations.connectedAccount")} value={account ?? "—"} />
        {lastSync ? <Field label={t("integrations.lastSync")} value={lastSync} /> : null}
        {item.syncStatus ? <Field label={t("integrations.syncStatus")} value={item.syncStatus} /> : null}
        {demoGoogle ? (
          <Field label={t("integrations.statusLabel")} value={t("integrations.status.demoNotLive")} />
        ) : item.errorMessage ? (
          <Field label={t("integrations.labels.error")} value={item.errorMessage} />
        ) : null}
        {!demoGoogle &&
        typeof item.metadata?.reconnectBanner === "string" &&
        item.metadata.reconnectBanner.trim().length > 0 ? (
          <Field label={t("integrations.labels.reconnectRequired")} value={item.metadata.reconnectBanner} />
        ) : null}
        {!demoGoogle && item.slug === "google-drive" && item.metadata?.googleDocsScopeMissing === true ? (
          <Field label={t("integrations.labels.googleDocs")} value={item.metadata.reconnectBanner as string ?? ""} />
        ) : null}
        {item.scopes?.length ? <Field label={t("integrations.labels.scopes")} value={item.scopes.join(", ")} /> : null}
        {modelPreview ? <Field label={t("integrations.labels.model")} value={modelPreview} /> : null}
        {apiPreview ? <Field label={t("integrations.labels.apiKey")} value={apiPreview} /> : null}
        {isSlack ? (
          <Field label={t("integrations.labels.connectionType")} value={t("integrations.status.incomingWebhook")} />
        ) : null}
        {isSlack ? (
          <Field label={t("integrations.labels.channel")} value={(item.metadata?.slackChannel as string) ?? "#job-alerts"} />
        ) : null}
        {item.slug === "smtp" ? (
          <>
            <p className="rounded-md border border-amber-500/35 bg-amber-500/5 p-2 text-xs text-muted-foreground">
              {t("integrations.warnings.smtpRailwayBlocked")}
            </p>
            <Field label={t("integrations.labels.smtpHost")} value={(item.metadata?.host as string | undefined) ?? "—"} />
            <Field label={t("integrations.labels.port")} value={item.metadata?.port != null ? String(item.metadata.port) : "—"} />
            <Field label={t("integrations.labels.fromEmail")} value={(item.metadata?.from as string | undefined) ?? "—"} />
            {item.metadata?.smtpPasswordSaved === true ? (
              <Field label={t("integrations.labels.appPassword")} value={t("integrations.status.savedSecurely")} />
            ) : null}
          </>
        ) : null}
        {isResend ? (
          <>
            <Field label={t("integrations.labels.apiKeyConfigured")} value={bool(item.metadata?.apiKeyConfigured === true)} />
            <Field label={t("integrations.labels.fromEmailConfigured")} value={bool(item.metadata?.fromEmailConfigured === true)} />
          </>
        ) : null}
        {isTelegram ? (
          <>
            <Field label={t("integrations.labels.botConfigured")} value={bool(item.metadata?.botTokenConfigured === true)} />
            <Field label={t("integrations.labels.chatConfigured")} value={bool(item.metadata?.chatIdConfigured === true)} />
            {typeof item.metadata?.lastNotificationAt === "string" ? (
              <Field label={t("integrations.labels.lastNotification")} value={fmtWhen(item.metadata.lastNotificationAt as string) ?? "—"} />
            ) : null}
          </>
        ) : null}
        {item.lastTest ? (
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <p className="font-medium text-muted-foreground">{t("integrations.labels.lastTest")}</p>
            <p className="mt-1">
              <span className="font-semibold">
                {TEST_STATUS_KEY[item.lastTest.status] ? t(TEST_STATUS_KEY[item.lastTest.status]) : item.lastTest.status}
              </span>
              {" · "}
              {item.lastTest.message}
            </p>
            <p className="mt-1 text-muted-foreground">{fmtWhen(item.lastTest.checkedAt)}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="default" size="sm" onClick={onConnect} disabled={isBusy(pending, item.slug, "connect")}>
            {isResend
              ? t("integrations.actions.configureInstructions")
              : isTelegram
                ? t("integrations.actions.configureTelegram")
                : isSlack
                  ? t("integrations.actions.configureSlack")
                  : connectLabel}
          </Button>
          <Button variant="secondary" size="sm" onClick={onTest} disabled={isBusy(pending, item.slug, "test")}>
            {isResend ? t("integrations.actions.testResend") : isTelegram ? t("integrations.actions.testTelegram") : isSlack ? t("integrations.actions.sendTestMessage") : t("integrations.actions.test")}
          </Button>
          {!isResend && !isLinkedin ? (
            <Button variant="outline" size="sm" onClick={onDisconnect} disabled={isBusy(pending, item.slug, "disconnect")}>
              {t("integrations.actions.disconnect")}
            </Button>
          ) : null}
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
