"use client";

import { AI_MODEL_OPTIONS } from "@/constants/aiModels";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n/I18nProvider";

type Props = {
  open: boolean;
  providerSlug: string | null;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
  initialEmail?: string;
  initialAccountName?: string;
  /** Gmail / Drive / Calendar: optional OAuth redirect (stub or real Google URL). */
  onGoogleConnect?: () => void | Promise<void>;
  googleConnectLoading?: boolean;
  /** When the integrations API is reachable (not mock fallback), show live OAuth copy instead of demo-only text. */
  showLiveGoogleOAuthCopy?: boolean;
  googleOAuthEnabled?: boolean | null;
  googleOAuthWarning?: string | null;
  /** Saved SMTP fields from API (never includes password). */
  initialSmtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    from?: string;
    fromName?: string;
  };
};

export function IntegrationConnectModal({
  open,
  providerSlug,
  onClose,
  onSubmit,
  loading,
  initialEmail,
  initialAccountName,
  onGoogleConnect,
  googleConnectLoading,
  showLiveGoogleOAuthCopy,
  googleOAuthEnabled,
  googleOAuthWarning,
  initialSmtp,
}: Props) {
  const [connectedEmail, setConnectedEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState("");
  const [from, setFrom] = useState("");
  const [fromName, setFromName] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [channelName, setChannelName] = useState("#job-alerts");
  const [databaseName, setDatabaseName] = useState("");
  const [notionWorkspace, setNotionWorkspace] = useState("");
  const [fallbackToStub] = useState(false);

  const aiModelChoices = useMemo(() => {
    if (!providerSlug || (providerSlug !== "openai" && providerSlug !== "claude")) return [];
    return AI_MODEL_OPTIONS.filter((m) => m.provider === providerSlug);
  }, [providerSlug]);

  useEffect(() => {
    if (!open || !providerSlug) return;
    setConnectedEmail(initialEmail ?? "");
    setAccountName(initialAccountName ?? "");
    if (providerSlug === "smtp") {
      const s = initialSmtp;
      setHost(typeof s?.host === "string" ? s.host : "");
      setPort(s?.port != null ? String(s.port) : "587");
      setSecure(typeof s?.secure === "boolean" ? s.secure : true);
      setSmtpUser(typeof s?.user === "string" ? s.user : "");
      setFrom(typeof s?.from === "string" ? s.from : "");
      setFromName(typeof s?.fromName === "string" ? s.fromName : "");
      setSmtpPass("");
      return;
    }

    const defaultModel =
      providerSlug === "claude"
        ? AI_MODEL_OPTIONS.find((m) => m.provider === "claude")?.model ?? "claude-3-5-haiku-latest"
        : AI_MODEL_OPTIONS.find((m) => m.provider === "openai" && m.model === "gpt-4o-mini")?.model ??
          AI_MODEL_OPTIONS.find((m) => m.provider === "openai")?.model ??
          "gpt-4o-mini";
    setModel(defaultModel);
    setFallbackToStub(true);
    setApiKey("");
    setWorkspaceName("Demo Workspace");
    setChannelName("#jobflow-alerts");
    setDatabaseName("Job Pipeline — Legacy");
    setNotionWorkspace("Legacy Teamspace");
  }, [open, providerSlug, initialEmail, initialAccountName, initialSmtp]);

  const { t } = useTranslation();

  const primaryLabel = useMemo(() => {
    if (!providerSlug) return t("integrations.modal.save");
    if (providerSlug === "gmail" || providerSlug === "google-drive" || providerSlug === "google-calendar")
      return googleOAuthEnabled === false ? t("integrations.actions.configureGoogleOAuth") : t("integrations.modal.connectWithGoogle");
    if (providerSlug === "openai" || providerSlug === "claude") return t("integrations.modal.saveDemoConfig");
    if (providerSlug === "smtp") return t("integrations.modal.saveSmtpSettings");
    if (providerSlug === "slack") return t("integrations.actions.sendTestMessage");
    if (providerSlug === "telegram") return t("integrations.actions.configureTelegram");
    if (providerSlug === "resend") return t("integrations.modal.done");
    if (providerSlug === "notion-legacy") return t("integrations.modal.saveLegacyImportConfig");
    return t("integrations.modal.save");
  }, [providerSlug, googleOAuthEnabled, t]);

  if (!open || !providerSlug) return null;

  const googleBlock =
    providerSlug === "gmail" || providerSlug === "google-drive" || providerSlug === "google-calendar";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (providerSlug === "gmail" || providerSlug === "google-drive" || providerSlug === "google-calendar") {
      await onSubmit({
        connectedEmail: connectedEmail || undefined,
        accountName: accountName || undefined,
        config: {},
      });
      return;
    }
    if (providerSlug === "openai" || providerSlug === "claude") {
      await onSubmit({
        config: {
          provider: providerSlug === "openai" ? "OpenAI" : "Claude",
          model,
          fallbackToStub,
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        },
      });
      return;
    }
    if (providerSlug === "smtp") {
      const portNum = Number.parseInt(port, 10);
      await onSubmit({
        config: {
          host: host.trim(),
          port: Number.isFinite(portNum) ? portNum : 587,
          secure,
          user: smtpUser.trim(),
          from: from.trim(),
          fromName: fromName.trim() || undefined,
          ...(smtpPass.trim() ? { pass: smtpPass.trim() } : {}),
        },
      });
      return;
    }
    if (providerSlug === "slack") {
      await onSubmit({
        config: {
          workspaceName,
          channelName,
        },
      });
      return;
    }
    if (providerSlug === "notion-legacy") {
      await onSubmit({
        config: {
          workspaceName: notionWorkspace,
          databaseName,
        },
      });
      return;
    }
    if (providerSlug === "telegram") {
      await onSubmit({ config: {} });
      return;
    }
    if (providerSlug === "resend") {
      await onSubmit({ config: {} });
      return;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t("integrations.modal.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground capitalize">{providerSlug.replace(/-/g, " ")}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {googleBlock ? (
            <>
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {googleOAuthWarning
                  ? googleOAuthWarning
                  : showLiveGoogleOAuthCopy
                  ? t("integrations.modal.googleOAuthLiveCopy")
                  : t("integrations.modal.googleOAuthDemoCopy")}
              </p>
              {onGoogleConnect ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void onGoogleConnect()}
                  disabled={loading || googleConnectLoading}
                >
                  {googleConnectLoading
                    ? t("integrations.modal.openingGoogle")
                    : googleOAuthEnabled === false
                      ? t("integrations.actions.configureGoogleOAuth")
                      : t("integrations.modal.connectWithGoogle")}
                </Button>
              ) : null}
              <p className="text-center text-xs text-muted-foreground">{t("integrations.modal.orUseOfflineDemo")}</p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.connectedEmail")}</p>
                <Input value={connectedEmail} onChange={(e) => setConnectedEmail(e.target.value)} placeholder="you@company.com" type="email" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.accountName")}</p>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Primary workspace" />
              </div>
            </>
          ) : null}

          {(providerSlug === "openai" || providerSlug === "claude") && (
            <>
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {t("integrations.modal.apiKeysMaskedWarning")}
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.labels.model")}</p>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {aiModelChoices.map((m) => (
                    <option key={m.model} value={m.model}>
                      {m.label} ({m.model})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.labels.apiKey")}</p>
                <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." type="password" autoComplete="off" />
              </div>
            </>
          )}

          {providerSlug === "smtp" && (
            <>
              <p className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                {t("integrations.modal.smtpWarning")}
              </p>
              <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{t("integrations.modal.gmailWorkspaceTitle")}</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Host: smtp.gmail.com</li>
                  <li>Port: 587</li>
                  <li>Secure TLS: enabled (STARTTLS)</li>
                  <li>Username: your Gmail or Workspace email</li>
                  <li>Password: Gmail App Password (not your login password)</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.smtpHost")}</p>
                  <Input
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.smtpPort")}</p>
                  <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="587" autoComplete="off" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} />
                {t("integrations.modal.secureTls")}
              </label>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.username")}</p>
                <Input
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="you@company.com"
                  type="email"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.passwordAppPassword")}</p>
                <Input
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={t("integrations.modal.passwordKeepSaved")}
                  type="password"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.fromEmail")}</p>
                <Input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="notifications@company.com"
                  type="email"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.fromName")}</p>
                <Input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="NewJob Guru"
                  autoComplete="off"
                />
              </div>
            </>
          )}

          {providerSlug === "telegram" && (
            <>
              <p className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                Telegram is configured via environment variables on the API server — not through this UI.
                Clicking <strong>Enable Telegram</strong> re-enables notifications using the already-configured bot token and chat ID.
              </p>
              <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">To change your Telegram bot or chat ID:</p>
                <ol className="mt-2 list-inside list-decimal space-y-1">
                  <li>Go to Railway → API service → Variables</li>
                  <li>Update <code className="rounded bg-muted px-1">TELEGRAM_BOT_TOKEN</code> and/or <code className="rounded bg-muted px-1">TELEGRAM_CHAT_ID</code></li>
                  <li>Redeploy the API service</li>
                  <li>Return here and click <strong>Enable Telegram</strong></li>
                </ol>
              </div>
            </>
          )}

          {providerSlug === "resend" && (
            <>
              <p className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                {t("integrations.modal.resendConfigInfo")}
              </p>
              <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{t("integrations.modal.resendConfigTitle")}</p>
                <ol className="mt-2 list-inside list-decimal space-y-1">
                  <li>{t("integrations.modal.resendStep1")}</li>
                  <li>{t("integrations.modal.resendStep2")}</li>
                  <li>{t("integrations.modal.resendStep3")}</li>
                </ol>
              </div>
            </>
          )}

          {providerSlug === "slack" && (
            <>
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {t("integrations.modal.slackInfo")}
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.connectionType")}</p>
                <p className="text-sm">{t("integrations.status.incomingWebhook")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.channel")}</p>
                <Input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="#job-alerts"
                />
              </div>
            </>
          )}

          {providerSlug === "notion-legacy" && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.databaseName")}</p>
                <Input value={databaseName} onChange={(e) => setDatabaseName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t("integrations.modal.workspaceName")}</p>
                <Input value={notionWorkspace} onChange={(e) => setNotionWorkspace(e.target.value)} />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading || googleConnectLoading}>
              {t("integrations.modal.cancel")}
            </Button>
            <Button type="submit" disabled={loading || googleConnectLoading}>
              {primaryLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
