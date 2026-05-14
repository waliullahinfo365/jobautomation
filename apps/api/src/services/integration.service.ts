import { AutomationLogModel, IntegrationConnectionModel } from "@jobflow/database/models";
import { notifications } from "@jobflow/integrations";
import { sendResendEmail } from "@jobflow/integrations/email/resend.service";
import { sendSmtpMail } from "@jobflow/integrations/smtp/mail";
import type {
  IntegrationCatalogEntry,
  IntegrationHealthSummary,
  IntegrationListItem,
  IntegrationProvider,
  IntegrationStatus,
  IntegrationTestResult,
} from "@jobflow/shared/types/integration";
import type { IntegrationTestStatus } from "@jobflow/shared/constants/statuses";
import { createAuditLog } from "./audit-log.service";
import { assertCanAddIntegration } from "./plan-limit.service";
import { assertTenantId } from "./baseTenant.service";
import { ApiError } from "../utils/errors";
import { encryptSecret } from "../utils/encryption";
import { getSmtpOutboundCredentials } from "./smtp-config.service";
import { providerFromSlug, slugForProvider } from "../utils/provider-slug";
import { getGoogleScopesForProvider, missingGoogleScopes } from "@jobflow/shared/constants/googleScopes";

export { providerFromSlug, slugForProvider } from "../utils/provider-slug";

const CATALOG: IntegrationCatalogEntry[] = [
  {
    provider: "Gmail",
    slug: "gmail",
    purpose: "Job alert intake, reply detection, and outbound messaging.",
    requiredFor: ["job-intake", "email-reply-detection", "follow-up-reminder"],
  },
  {
    provider: "Google Drive",
    slug: "google-drive",
    purpose:
      "Job folders, CV routing, storage, PDF exports, and scheduled reports (Drive API + Google Docs API for digest/report documents).",
    requiredFor: ["folder-automation", "cv-routing", "pdf-export", "daily-digest", "weekly-report"],
  },
  {
    provider: "Google Calendar",
    slug: "google-calendar",
    purpose: "Interview scheduling and calendar reminders.",
    requiredFor: ["interview-scheduling"],
  },
  {
    provider: "Telegram",
    slug: "telegram",
    purpose: "Telegram notifications for job alerts, reminders, reports, and automation failures.",
    requiredFor: ["notifications", "daily-digest", "weekly-report", "deadline-alert", "follow-up-reminder"],
  },
  {
    provider: "OpenAI",
    slug: "openai",
    purpose: "Research, drafts, extraction, and classification.",
    requiredFor: ["ai-processing", "research-document"],
  },
  {
    provider: "Claude",
    slug: "claude",
    purpose: "Alternative AI generation path.",
    requiredFor: ["ai-processing"],
  },
  {
    provider: "SMTP",
    slug: "smtp",
    purpose:
      "Legacy SMTP (often blocked on Railway). Prefer Resend for production email. Optional fallback when Resend is not configured.",
    requiredFor: ["daily-digest", "weekly-report", "follow-up-reminder"],
  },
  {
    provider: "Resend",
    slug: "resend",
    purpose:
      "Email API delivery for reports, digests, and reminders. Recommended for Railway production (HTTPS, no raw SMTP).",
    requiredFor: ["daily-digest", "weekly-report", "follow-up-reminder", "deadline-alert"],
  },
  {
    provider: "Notion Legacy",
    slug: "notion-legacy",
    purpose: "One-time import from legacy Notion pipelines.",
    requiredFor: [],
  },
  {
    provider: "Slack",
    slug: "slack",
    purpose:
      "Admin/team alerts for automation failures, Google reconnect warnings, queue issues, and summaries.",
    requiredFor: ["lifecycle-monitoring"],
  },
];

const SLACK_DEFAULT_CHANNEL = "#job-alerts";

function slackAlertChannelDisplay(meta: Record<string, unknown>): string {
  const fromMeta = meta.slackChannel ?? meta.channel;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  const fromEnv = process.env.SLACK_ALERT_CHANNEL?.trim();
  return fromEnv || SLACK_DEFAULT_CHANNEL;
}

function maskSecret(raw: string): string {
  const t = raw.trim();
  if (t.length <= 8) return "••••••••";
  return `${t.slice(0, 3)}••••${t.slice(-4)}`;
}

function smtpTestSafeReason(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const noSecretHint = raw
    .replace(/\b(pass|password|auth)\s*[=:]\s*\S+/gi, "")
    .replace(/\bxoauth2\b/gi, "")
    .trim();
  const brief = (noSecretHint || "Send error").slice(0, 180);
  return brief;
}

const GMAIL_SMTP_AUTH_MESSAGE =
  "SMTP authentication failed. Check Gmail App Password and 2-Step Verification.";

function smtpFailureIsLikelyAuth(error: unknown): boolean {
  const raw = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    raw.includes("invalid login") ||
    raw.includes("authentication failed") ||
    raw.includes("badcredentials") ||
    raw.includes("username and password not accepted") ||
    raw.includes("5.7.8") ||
    raw.includes("535") ||
    raw.includes("eauth") ||
    raw.includes("application-specific password") ||
    raw.includes("534-5.7.9")
  );
}

function sanitizeConfigForStorage(provider: IntegrationProvider, config: Record<string, unknown>): Record<string, unknown> {
  const next = { ...config };
  if (provider === "SMTP" && typeof next.password === "string" && typeof next.pass !== "string") {
    next.pass = next.password;
    delete next.password;
  }
  if (typeof next.apiKey === "string") {
    next.apiKeyPreview = maskSecret(next.apiKey);
    delete next.apiKey;
  }
  if (typeof next.password === "string") {
    next.passwordPreview = maskSecret(next.password);
    delete next.password;
  }
  if (typeof next.clientSecret === "string") {
    next.clientSecretPreview = maskSecret(next.clientSecret);
    delete next.clientSecret;
  }
  if (provider === "SMTP" && typeof next.pass === "string") {
    delete next.pass;
  }
  return next;
}

function sanitizeMetadataForResponse(meta: Record<string, unknown>): Record<string, unknown> {
  const out = { ...meta };
  delete out.apiKey;
  delete out.password;
  delete out.clientSecret;
  delete out.pass;
  delete out.accessToken;
  delete out.refreshToken;
  delete out.passPreview;
  return out;
}

function rowToItem(entry: IntegrationCatalogEntry, row: Record<string, unknown> | null): IntegrationListItem {
  const meta = (row?.metadata as Record<string, unknown>) ?? {};
  const lastTest = meta.lastTest as IntegrationTestResult | undefined;
  const cleanMeta = sanitizeMetadataForResponse(meta);
  const isGoogleProvider =
    entry.provider === "Gmail" || entry.provider === "Google Drive" || entry.provider === "Google Calendar";
  const isDemoGoogle =
    isGoogleProvider &&
    (cleanMeta.demoConnection === true ||
      cleanMeta.stub === true ||
      row?.connectedEmail === "oauth-demo-user@example.com");
  const status =
    isDemoGoogle && (row?.status as IntegrationStatus | undefined) === "Connected"
      ? "Needs Attention"
      : ((row?.status as IntegrationStatus) ?? "Not Connected");
  if (isDemoGoogle) {
    cleanMeta.demoConnection = true;
    cleanMeta.reconnectRequired = true;
    cleanMeta.provider = entry.slug;
  }
  if (entry.provider === "Telegram") {
    const botTokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
    const chatIdConfigured = Boolean(process.env.TELEGRAM_CHAT_ID?.trim());
    cleanMeta.botTokenConfigured = botTokenConfigured;
    cleanMeta.chatIdConfigured = chatIdConfigured;
    if (!botTokenConfigured || !chatIdConfigured) {
      cleanMeta.lastConfigWarning =
        "Telegram bot token or chat ID is missing. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway.";
    }
  }

  let resolvedStatus = status;
  let resolvedSyncStatus = row?.syncStatus as string | undefined;
  let resolvedError =
    entry.provider === "Telegram" && !(cleanMeta.botTokenConfigured === true && cleanMeta.chatIdConfigured === true)
      ? "Telegram bot token or chat ID is missing. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway."
      : (row?.errorMessage as string | undefined);

  if (entry.provider === "Telegram") {
    const botTokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
    const chatIdConfigured = Boolean(process.env.TELEGRAM_CHAT_ID?.trim());
    const envConfigured = botTokenConfigured && chatIdConfigured;
    const isDisabled = (row?.status as IntegrationStatus | undefined) === "Disabled";
    if (isDisabled) {
      resolvedStatus = "Disabled";
      resolvedSyncStatus = "Disconnected";
      resolvedError = undefined;
    } else if (!envConfigured) {
      resolvedStatus = "Not Connected";
      resolvedSyncStatus = "Not configured";
      resolvedError = "Telegram bot token or chat ID is missing. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway.";
    } else {
      resolvedStatus = "Connected";
      resolvedSyncStatus = "Connected";
      resolvedError = undefined;
    }
  }

  if (entry.provider === "Slack") {
    const webhookConfigured = Boolean(process.env.SLACK_WEBHOOK_URL?.trim());
    cleanMeta.webhookConfigured = webhookConfigured;
    cleanMeta.connectionType = "Incoming Webhook";
    cleanMeta.slackChannel = slackAlertChannelDisplay(meta);
    const lastFailed = lastTest?.status === "Failed";
    resolvedSyncStatus = webhookConfigured ? "Incoming Webhook" : "Not configured";
    if (!webhookConfigured) {
      resolvedStatus = "Not Connected";
      resolvedError = "Add SLACK_WEBHOOK_URL in Railway to enable Slack alerts.";
    } else if (lastFailed) {
      resolvedStatus = "Needs Attention";
      resolvedError = lastTest?.message;
    } else {
      resolvedStatus = "Connected";
      resolvedError = undefined;
    }
  }

  if (entry.provider === "Resend") {
    const apiKeyConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
    const fromEmailConfigured = Boolean(process.env.RESEND_FROM_EMAIL?.trim());
    cleanMeta.apiKeyConfigured = apiKeyConfigured;
    cleanMeta.fromEmailConfigured = fromEmailConfigured;
    const envOk = apiKeyConfigured && fromEmailConfigured;
    if (!envOk) {
      resolvedStatus = "Not Connected";
      resolvedSyncStatus = "Not configured";
      resolvedError = "Add RESEND_API_KEY and RESEND_FROM_EMAIL to the API server environment (Railway).";
    } else {
      resolvedSyncStatus = "Resend API";
      if (lastTest?.status === "Failed") {
        resolvedStatus = "Needs Attention";
        resolvedError = typeof lastTest.message === "string" ? lastTest.message : undefined;
      } else {
        resolvedStatus = "Connected";
        resolvedError = undefined;
      }
    }
  }

  const scopesList = Array.isArray(row?.scopes) ? (row.scopes as string[]) : [];

  if (isGoogleProvider && !isDemoGoogle && row && resolvedStatus === "Connected") {
    const required = getGoogleScopesForProvider(entry.provider);
    const scopeGap = missingGoogleScopes(scopesList, required);
    if (scopeGap.length > 0) {
      const docsMissing = scopeGap.some((s) => s.includes("/auth/documents"));
      cleanMeta.reconnectRequired = true;
      cleanMeta.reconnectBanner = docsMissing
        ? "Reconnect required — Google Docs scope missing."
        : "Reconnect required because Google scopes changed.";
      cleanMeta.missingScopes = scopeGap;
      cleanMeta.googleDocsScopeMissing = docsMissing;
      resolvedSyncStatus = resolvedSyncStatus ?? "Reconnect — scopes outdated";
    }
  }

  if (entry.provider === "SMTP" && row) {
    cleanMeta.smtpPasswordSaved = Boolean(row.accessTokenEncrypted);
  }

  return {
    ...entry,
    status: resolvedStatus,
    connectedEmail: row?.connectedEmail as string | undefined,
    accountName: row?.accountName as string | undefined,
    lastSyncAt: row?.lastSyncAt ? new Date(row.lastSyncAt as string | Date).toISOString() : undefined,
    syncStatus: resolvedSyncStatus,
    errorMessage: resolvedError,
    scopes: scopesList,
    metadata: cleanMeta,
    lastTest,
  };
}

function canonicalProviderKey(value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "gmail") return "Gmail";
  if (v === "google-drive" || v === "google drive") return "Google Drive";
  if (v === "google-calendar" || v === "google calendar") return "Google Calendar";
  if (v === "telegram") return "Telegram";
  if (v === "openai") return "OpenAI";
  if (v === "claude") return "Claude";
  if (v === "smtp") return "SMTP";
  if (v === "notion-legacy" || v === "notion legacy") return "Notion Legacy";
  if (v === "slack") return "Slack";
  if (v === "resend") return "Resend";
  return value;
}

function rankIntegrationRow(row: Record<string, unknown>): number {
  const status = row.status as IntegrationStatus | undefined;
  const meta = (row.metadata as Record<string, unknown> | undefined) ?? {};
  const demo =
    meta.demoConnection === true ||
    meta.stub === true ||
    row.connectedEmail === "oauth-demo-user@example.com";
  const active = meta.isActive === true || status === "Connected";
  if (active && !demo) return 100;
  if (!demo && status === "Needs Attention") return 80;
  if (demo && status === "Needs Attention") return 40;
  if (status === "Connected") return 30;
  if (status === "Disabled") return 10;
  return 20;
}

export async function listIntegrations(input: { tenantId: string }): Promise<IntegrationListItem[]> {
  const tenantId = assertTenantId(input.tenantId);
  const rows = await IntegrationConnectionModel.find({ tenantId }).lean();
  const byProvider = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    const row = r as Record<string, unknown>;
    const key = canonicalProviderKey(String(row.provider ?? ""));
    const existing = byProvider.get(key);
    if (!existing || rankIntegrationRow(row) > rankIntegrationRow(existing)) {
      byProvider.set(key, row);
    }
  }
  return CATALOG.map((entry) => rowToItem(entry, byProvider.get(entry.provider) ?? null));
}

export async function getIntegrationHealth(input: { tenantId: string }): Promise<IntegrationHealthSummary> {
  const items = await listIntegrations(input);
  const summary: IntegrationHealthSummary = {
    connected: 0,
    needsAttention: 0,
    notConnected: 0,
    expired: 0,
    disabled: 0,
  };
  for (const i of items) {
    switch (i.status) {
      case "Connected":
        summary.connected += 1;
        break;
      case "Needs Attention":
        summary.needsAttention += 1;
        break;
      case "Not Connected":
        summary.notConnected += 1;
        break;
      case "Expired":
        summary.expired += 1;
        break;
      case "Disabled":
        summary.disabled += 1;
        break;
      default:
        summary.notConnected += 1;
    }
  }
  return summary;
}

export async function connectIntegration(input: {
  tenantId: string;
  userId: string;
  providerSlug: string;
  body: {
    connectedEmail?: string;
    accountName?: string;
    config?: Record<string, unknown>;
    scopes?: string[];
  };
}): Promise<IntegrationListItem> {
  const tenantId = assertTenantId(input.tenantId);
  const provider = providerFromSlug(input.providerSlug);
  if (!provider) throw new ApiError("Unknown integration provider", 422, "UNKNOWN_PROVIDER");

  if (provider === "Resend") {
    const catalog = CATALOG.find((c) => c.provider === "Resend")!;
    const row = (await IntegrationConnectionModel.findOne({ tenantId, provider: "Resend" }).lean()) as Record<
      string,
      unknown
    > | null;
    return rowToItem(catalog, row);
  }

  const prev = (await IntegrationConnectionModel.findOne({ tenantId, provider }).lean()) as Record<
    string,
    unknown
  > | null;
  const hadActiveConnection =
    prev && (prev.status === "Connected" || prev.status === "Needs Attention");
  if (!hadActiveConnection) {
    await assertCanAddIntegration(tenantId);
  }

  const catalog = CATALOG.find((c) => c.provider === provider)!;

  if (provider === "SMTP") {
    const raw = (input.body.config ?? {}) as Record<string, unknown>;
    const host = typeof raw.host === "string" ? raw.host.trim() : "";
    const user = typeof raw.user === "string" ? raw.user.trim() : "";
    const from = typeof raw.from === "string" ? raw.from.trim() : "";
    const fromName = typeof raw.fromName === "string" ? raw.fromName.trim() : "";
    const portRaw = raw.port;
    const portNum =
      typeof portRaw === "number" && Number.isFinite(portRaw)
        ? portRaw
        : typeof portRaw === "string"
          ? Number.parseInt(portRaw, 10)
          : Number.NaN;
    const port = Number.isFinite(portNum) ? portNum : 587;
    const secure = Boolean(raw.secure);
    const passRaw =
      typeof raw.pass === "string"
        ? raw.pass.trim()
        : typeof raw.password === "string"
          ? raw.password.trim()
          : "";

    const sanitized = sanitizeConfigForStorage("SMTP", {
      host,
      port,
      secure,
      user,
      from,
      ...(fromName ? { fromName } : {}),
      ...(passRaw ? { pass: passRaw } : {}),
    });

    const prevMeta = (prev?.metadata as Record<string, unknown>) ?? {};
    const mergedMeta: Record<string, unknown> = {
      ...prevMeta,
      ...sanitized,
      stub: false,
    };
    delete mergedMeta.demoConnection;
    mergedMeta.smtpSavedAt = new Date().toISOString();

    let newAccessEncrypted: string | undefined;
    if (passRaw) {
      newAccessEncrypted = encryptSecret(passRaw);
    }

    const prevEnc = prev?.accessTokenEncrypted as string | undefined;
    const hasSecret = Boolean(newAccessEncrypted ?? prevEnc);
    const fieldsOk = Boolean(host && user && from);
    const complete = fieldsOk && hasSecret;
    const status = complete ? ("Connected" as IntegrationStatus) : ("Needs Attention" as IntegrationStatus);
    const errorMessage = complete
      ? undefined
      : !fieldsOk
        ? "Host, username, and from email are required."
        : "Add an app password (or save without changing password when one is already stored).";

    const setDoc: Record<string, unknown> = {
      tenantId,
      provider,
      status,
      connectedEmail: from || undefined,
      accountName: fromName || undefined,
      scopes: [],
      errorMessage,
      syncStatus: complete ? "SMTP ready" : "Incomplete",
      lastSyncAt: new Date(),
      metadata: mergedMeta,
      updatedBy: input.userId,
    };
    if (newAccessEncrypted !== undefined) {
      setDoc.accessTokenEncrypted = newAccessEncrypted;
    }

    const doc = await IntegrationConnectionModel.findOneAndUpdate(
      { tenantId, provider },
      {
        $set: setDoc,
        $setOnInsert: {
          createdBy: input.userId,
        },
      },
      { upsert: true, new: true, lean: true }
    );

    await createAuditLog({
      tenantId,
      userId: input.userId,
      action: "integration.connected",
      entityType: "IntegrationConnection",
      entityId: provider,
      message: `SMTP settings saved`,
      metadata: { provider, slug: input.providerSlug },
    });

    return rowToItem(catalog, doc as Record<string, unknown>);
  }

  const cfg = input.body.config ? sanitizeConfigForStorage(provider, input.body.config) : {};
  const prevMeta = (prev?.metadata as Record<string, unknown>) ?? {};
  const mergedMeta: Record<string, unknown> = {
    ...prevMeta,
    ...cfg,
    demoConnectedAt: new Date().toISOString(),
  };

  let newAccessEncrypted: string | undefined;
  if (provider === "OpenAI" || provider === "Claude") {
    mergedMeta.providerType = "ai";
    const modelPick =
      (input.body.config?.model as string) ||
      (cfg.model as string) ||
      (provider === "OpenAI" ? "gpt-4o-mini" : "claude-3-5-haiku-latest");
    mergedMeta.model = modelPick;
    mergedMeta.fallbackToStub = input.body.config?.fallbackToStub !== false;
    const rawKey = typeof input.body.config?.apiKey === "string" ? input.body.config.apiKey.trim() : "";
    if (rawKey) {
      newAccessEncrypted = encryptSecret(rawKey);
    }
    delete mergedMeta.stub;
  } else {
    if (provider === "Telegram") {
      const botTokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
      const chatIdConfigured = Boolean(process.env.TELEGRAM_CHAT_ID?.trim());
      mergedMeta.botTokenConfigured = botTokenConfigured;
      mergedMeta.chatIdConfigured = chatIdConfigured;
      mergedMeta.stub = false;
    } else {
      mergedMeta.stub = true;
    }
    if (provider === "Gmail" || provider === "Google Drive" || provider === "Google Calendar") {
      mergedMeta.demoConnection = true;
      mergedMeta.reconnectRequired = true;
      mergedMeta.provider = slugForProvider(provider);
    }
  }

  const isGoogleDemo = provider === "Gmail" || provider === "Google Drive" || provider === "Google Calendar";
  const isTelegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) && Boolean(process.env.TELEGRAM_CHAT_ID?.trim());
  const setDoc: Record<string, unknown> = {
    tenantId,
    provider,
    status: (isGoogleDemo ? "Needs Attention" : provider === "Telegram" && !isTelegramConfigured ? "Not Connected" : "Connected") as IntegrationStatus,
    connectedEmail: input.body.connectedEmail,
    accountName: input.body.accountName,
    scopes: input.body.scopes ?? [],
    errorMessage:
      isGoogleDemo
        ? "Google reconnect required: demo connection cannot call Google APIs."
        : provider === "Telegram" && !isTelegramConfigured
          ? "Telegram bot token or chat ID is missing. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway."
          : undefined,
    syncStatus: isGoogleDemo ? "Demo / Not Live" : provider === "Telegram" ? (isTelegramConfigured ? "Connected" : "Not configured") : "OK",
    lastSyncAt: new Date(),
    metadata: mergedMeta,
    updatedBy: input.userId,
  };
  if (newAccessEncrypted !== undefined) {
    setDoc.accessTokenEncrypted = newAccessEncrypted;
  }

  const doc = await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider },
    {
      $set: setDoc,
      $setOnInsert: {
        createdBy: input.userId,
      },
    },
    { upsert: true, new: true, lean: true }
  );

  await createAuditLog({
    tenantId,
    userId: input.userId,
    action: "integration.connected",
    entityType: "IntegrationConnection",
    entityId: provider,
    message: `Integration connected (stub): ${provider}`,
    metadata: { provider, slug: input.providerSlug },
  });

  return rowToItem(catalog, doc as Record<string, unknown>);
}

export async function disconnectIntegration(input: {
  tenantId: string;
  userId: string;
  providerSlug: string;
}): Promise<IntegrationListItem> {
  const tenantId = assertTenantId(input.tenantId);
  const provider = providerFromSlug(input.providerSlug);
  if (!provider) throw new ApiError("Unknown integration provider", 422, "UNKNOWN_PROVIDER");

  const catalog = CATALOG.find((c) => c.provider === provider)!;

  if (provider === "Resend") {
    await IntegrationConnectionModel.deleteMany({ tenantId, provider: "Resend" });
    return rowToItem(catalog, null);
  }

  const doc = await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider },
    {
      $set: {
        status: "Disabled" as IntegrationStatus,
        connectedEmail: undefined,
        accountName: undefined,
        errorMessage: undefined,
        syncStatus: undefined,
        lastSyncAt: undefined,
        scopes: [],
        metadata: { disconnectedAt: new Date().toISOString() },
        updatedBy: input.userId,
      },
      $unset: { accessTokenEncrypted: 1 },
    },
    { new: true, lean: true }
  );

  if (!doc) {
    return rowToItem(catalog, null);
  }

  await createAuditLog({
    tenantId,
    userId: input.userId,
    action: "integration.disconnected",
    entityType: "IntegrationConnection",
    entityId: provider,
    message: `Integration disconnected: ${provider}`,
    metadata: { provider, slug: input.providerSlug },
  });

  return rowToItem(catalog, doc as Record<string, unknown>);
}

export async function testIntegration(input: {
  tenantId: string;
  userId: string;
  providerSlug: string;
}): Promise<IntegrationTestResult> {
  const tenantId = assertTenantId(input.tenantId);
  const provider = providerFromSlug(input.providerSlug);
  if (!provider) throw new ApiError("Unknown integration provider", 422, "UNKNOWN_PROVIDER");

  const row = (await IntegrationConnectionModel.findOne({ tenantId, provider }).lean()) as Record<
    string,
    unknown
  > | null;
  const statusRow = row?.status as IntegrationStatus | undefined;

  if (provider === "Resend") {
    throw new ApiError(
      'Use POST /integrations/resend/test with optional body { "to": "you@example.com" }.',
      400,
      "USE_RESEND_TEST_ROUTE"
    );
  }

  if (provider === "SMTP") {
    let testStatus: IntegrationTestStatus;
    let message: string;
    let automationLogMessage: string;

    const outbound = await getSmtpOutboundCredentials(tenantId);
    if (!outbound) {
      testStatus = "Warning";
      message = "SMTP is not fully configured.";
      automationLogMessage = "SMTP not fully configured.";
    } else {
      const toAddr =
        typeof row?.connectedEmail === "string" && row.connectedEmail.trim().length > 0
          ? row.connectedEmail.trim()
          : outbound.from;
      try {
        await sendSmtpMail({
          ...outbound,
          to: toAddr,
          subject: "NewJob Guru SMTP Test",
          html: "<p>SMTP email delivery is connected.</p>",
          text: "SMTP email delivery is connected.",
        });
        testStatus = "Success";
        message = "Test email sent successfully.";
        automationLogMessage = "SMTP test email sent";
      } catch (e) {
        if (smtpFailureIsLikelyAuth(e)) {
          testStatus = "Warning";
          message = GMAIL_SMTP_AUTH_MESSAGE;
          automationLogMessage = GMAIL_SMTP_AUTH_MESSAGE;
        } else {
          testStatus = "Failed";
          message = `SMTP test email failed: ${smtpTestSafeReason(e)}`;
          automationLogMessage = "SMTP test failed";
        }
      }
    }

    const checkedAt = new Date().toISOString();
    const result: IntegrationTestResult = {
      provider,
      status: testStatus,
      message,
      checkedAt,
      metadata: {},
    };

    const automationStatus =
      testStatus === "Success" ? "Success" : testStatus === "Warning" ? "Warning" : "Failed";

    await AutomationLogModel.create({
      tenantId,
      createdBy: input.userId,
      moduleKey: "smtp",
      moduleName: "smtp",
      status: automationStatus,
      message: automationLogMessage,
      metadata: { provider: "smtp", slug: input.providerSlug },
    });

    if (row?._id) {
      await IntegrationConnectionModel.updateOne(
        { _id: row._id },
        {
          $set: {
            "metadata.lastTest": result,
          },
        }
      );
    }

    await createAuditLog({
      tenantId,
      userId: input.userId,
      action: "integration.tested",
      entityType: "IntegrationConnection",
      entityId: provider,
      message: `Integration test: ${testStatus}`,
      metadata: { provider, slug: input.providerSlug, result: testStatus },
    });

    return result;
  }

  let testStatus: IntegrationTestStatus;
  let message: string;

  if (statusRow === "Connected") {
    const meta = (row?.metadata as Record<string, unknown>) ?? {};
    const isGoogleProvider = provider === "Gmail" || provider === "Google Drive" || provider === "Google Calendar";
    const demoGoogle =
      isGoogleProvider &&
      (meta.demoConnection === true || meta.reconnectRequired === true || row?.connectedEmail === "oauth-demo-user@example.com");
    if (demoGoogle) {
      testStatus = "Failed";
      message = "Google OAuth demo connection detected. Configure live Google OAuth and reconnect.";
    } else if (provider === "OpenAI" || provider === "Claude") {
      const accessEnc = row?.accessTokenEncrypted;
      const preview = meta?.apiKeyPreview;
      if (!accessEnc && !preview) {
        testStatus = "Warning";
        message = `${provider} is connected without an API key — add a key or use demo connect.`;
      } else {
        testStatus = "Success";
        message = `${provider} configuration OK (stub test; no external AI call).`;
      }
    } else {
      testStatus = "Success";
      message = `${provider} connection is configured and ready.`;
    }
  } else if (statusRow === "Not Connected" || !statusRow) {
    testStatus = "Warning";
    message = `${provider} is not connected — connect before production use.`;
  } else if (statusRow === "Needs Attention" || statusRow === "Expired") {
    testStatus = "Failed";
    message = `${provider} requires attention or re-authentication (stub).`;
  } else {
    testStatus = "Warning";
    message = `${provider} is disabled or inactive for this workspace.`;
  }

  const checkedAt = new Date().toISOString();
  const result: IntegrationTestResult = {
    provider,
    status: testStatus,
    message,
    checkedAt,
    metadata: { stub: true },
  };

  if (row?._id) {
    await IntegrationConnectionModel.updateOne(
      { _id: row._id },
      {
        $set: {
          "metadata.lastTest": result,
        },
      }
    );
  }

  await createAuditLog({
    tenantId,
    userId: input.userId,
    action: "integration.tested",
    entityType: "IntegrationConnection",
    entityId: provider,
    message: `Integration test: ${testStatus}`,
    metadata: { provider, slug: input.providerSlug, result: testStatus },
  });

  return result;
}

export async function findIntegrationListItem(input: {
  tenantId: string;
  provider: IntegrationProvider;
}): Promise<IntegrationListItem | null> {
  const items = await listIntegrations({ tenantId: input.tenantId });
  return items.find((i) => i.provider === input.provider) ?? null;
}

export async function getTelegramStatus(input: { tenantId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const botTokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  const chatIdConfigured = Boolean(process.env.TELEGRAM_CHAT_ID?.trim());
  const configured = botTokenConfigured && chatIdConfigured;
  const row = (await IntegrationConnectionModel.findOne({ tenantId, provider: "Telegram" }).lean()) as
    | Record<string, unknown>
    | null;
  const meta = ((row?.metadata as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const lastTest = meta.lastTest ?? null;
  const lastNotificationAt = meta.lastNotificationAt ?? null;
  const isDisabled = row?.status === "Disabled";
  const status: "connected" | "not_configured" | "needs_attention" | "disabled" = isDisabled
    ? "disabled"
    : configured
      ? row?.status === "Needs Attention"
        ? "needs_attention"
        : "connected"
      : "not_configured";
  return {
    configured,
    botTokenConfigured,
    chatIdConfigured,
    status: status as "connected" | "not_configured" | "needs_attention" | "disabled",
    lastTest,
    lastNotificationAt,
    message: isDisabled
      ? "Telegram is disconnected. Click Connect to re-enable."
      : configured
        ? "Telegram is configured."
        : "Telegram bot token or chat ID is missing. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway.",
  };
}

export async function testTelegramNotification(input: { tenantId: string; userId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const checkedAt = new Date().toISOString();
  const result = await notifications.sendTelegramNotification({
    tenantId,
    event: "daily-digest",
    message: "✅ NewJob Guru Telegram notifications are connected.",
  });
  const isConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) && Boolean(process.env.TELEGRAM_CHAT_ID?.trim());
  const status = result.status === "Sent" ? "Success" : result.status === "Warning" ? "Warning" : "Failed";
  const message =
    result.status === "Sent"
      ? "Telegram test notification sent"
      : result.reason ?? (isConfigured ? "Telegram test failed" : "Telegram not configured");
  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider: "Telegram" },
    {
      $set: {
        tenantId,
        provider: "Telegram",
        status: isConfigured ? "Connected" : "Not Connected",
        syncStatus: isConfigured ? "Active" : "Not Configured",
        lastSyncAt: new Date(),
        metadata: {
          botTokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
          chatIdConfigured: Boolean(process.env.TELEGRAM_CHAT_ID?.trim()),
          lastNotificationAt: result.status === "Sent" ? checkedAt : undefined,
          lastTest: {
            provider: "Telegram",
            status,
            message,
            checkedAt,
          },
        },
        updatedBy: input.userId,
      },
      $setOnInsert: { createdBy: input.userId },
    },
    { upsert: true }
  );
  await AutomationLogModel.create({
    tenantId,
    createdBy: input.userId,
    moduleKey: "telegram-notifications",
    moduleName: "telegram-notifications",
    status,
    message,
    metadata: { provider: "telegram" },
  });
  return { provider: "Telegram" as const, status, message, checkedAt };
}

export async function testSlackNotification(input: { tenantId: string; userId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const checkedAt = new Date().toISOString();
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  let status: IntegrationTestStatus;
  let message: string;

  if (!webhook) {
    status = "Warning";
    message = "Slack webhook is not configured.";
  } else {
    const posted = await notifications.sendSlackNotification({
      tenantId,
      event: "daily-digest",
      message: "✅ NewJob Guru Slack notifications are connected.",
    });
    if (posted.status === "Sent") {
      status = "Success";
      message = "Slack test notification sent";
    } else {
      status = posted.status === "Warning" ? "Warning" : "Failed";
      message = posted.reason ?? "Slack test failed.";
    }
  }

  await AutomationLogModel.create({
    tenantId,
    createdBy: input.userId,
    moduleKey: "slack-notifications",
    moduleName: "slack-notifications",
    status,
    message,
    metadata: { provider: "slack" },
  });

  return { provider: "Slack" as const, status, message, checkedAt };
}

export type ResendEnvStatus = {
  configured: boolean;
  apiKeyConfigured: boolean;
  fromEmailConfigured: boolean;
  status: "connected" | "not_configured" | "needs_attention";
  lastTest?: IntegrationTestResult;
};

export async function getResendEnvStatus(input: { tenantId: string }): Promise<ResendEnvStatus> {
  const tenantId = assertTenantId(input.tenantId);
  const apiKeyConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const fromEmailConfigured = Boolean(process.env.RESEND_FROM_EMAIL?.trim());
  const configured = apiKeyConfigured && fromEmailConfigured;
  const row = (await IntegrationConnectionModel.findOne({ tenantId, provider: "Resend" }).lean()) as Record<
    string,
    unknown
  > | null;
  const meta = (row?.metadata as Record<string, unknown> | undefined) ?? {};
  const lastTest = meta.lastTest as IntegrationTestResult | undefined;
  let status: ResendEnvStatus["status"];
  if (!configured) status = "not_configured";
  else if (lastTest?.status === "Failed") status = "needs_attention";
  else status = "connected";
  return { configured, apiKeyConfigured, fromEmailConfigured, status, lastTest };
}

export async function testResendNotification(input: {
  tenantId: string;
  userId: string;
  to?: string;
  userEmail?: string;
}): Promise<IntegrationTestResult> {
  const tenantId = assertTenantId(input.tenantId);
  const checkedAt = new Date().toISOString();
  const apiKeyConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const fromEmailConfigured = Boolean(process.env.RESEND_FROM_EMAIL?.trim());

  async function persistLastTest(result: IntegrationTestResult) {
    await IntegrationConnectionModel.findOneAndUpdate(
      { tenantId, provider: "Resend" },
      {
        $set: {
          tenantId,
          provider: "Resend",
          status:
            result.status === "Success"
              ? ("Connected" as IntegrationStatus)
              : ("Needs Attention" as IntegrationStatus),
          syncStatus: "Resend API",
          lastSyncAt: new Date(),
          metadata: { lastTest: result },
          scopes: [],
          updatedBy: input.userId,
        },
        $setOnInsert: { createdBy: input.userId },
      },
      { upsert: true }
    );
  }

  if (!apiKeyConfigured || !fromEmailConfigured) {
    const result: IntegrationTestResult = {
      provider: "Resend",
      status: "Warning",
      message: "Resend is not fully configured.",
      checkedAt,
      metadata: {},
    };
    await persistLastTest(result);
    await AutomationLogModel.create({
      tenantId,
      createdBy: input.userId,
      moduleKey: "resend-email",
      moduleName: "resend-email",
      status: "Warning",
      message: "Resend not configured",
      metadata: {},
    });
    await createAuditLog({
      tenantId,
      userId: input.userId,
      action: "integration.tested",
      entityType: "IntegrationConnection",
      entityId: "Resend",
      message: `Integration test: ${result.status}`,
      metadata: { provider: "Resend", slug: "resend", result: result.status },
    });
    return result;
  }

  const recipient =
    typeof input.to === "string" && input.to.trim()
      ? input.to.trim()
      : typeof input.userEmail === "string" && input.userEmail.trim()
        ? input.userEmail.trim()
        : "";
  if (!recipient) {
    throw new ApiError(
      'Provide recipient email in the request body as { "to": "you@example.com" } or sign in with a JWT that includes your email.',
      422,
      "RECIPIENT_REQUIRED"
    );
  }

  const sendResult = await sendResendEmail({
    to: recipient,
    subject: "NewJob Guru Resend Test",
    html: "<p>Resend email delivery is connected.</p>",
    text: "Resend email delivery is connected.",
  });

  let result: IntegrationTestResult;
  let automationStatus: "Success" | "Warning" | "Failed";
  let automationMessage: string;

  if (sendResult.success) {
    result = {
      provider: "Resend",
      status: "Success",
      message: "Test email sent successfully.",
      checkedAt,
      metadata: {},
    };
    automationStatus = "Success";
    automationMessage = "Resend test email sent";
  } else {
    const safe = sendResult.message.replace(/\b(sk|rsk)_[a-z0-9_-]{10,}/gi, "[redacted]");
    result = {
      provider: "Resend",
      status: "Failed",
      message: `Resend email failed: ${safe.slice(0, 220)}`,
      checkedAt,
      metadata: {},
    };
    automationStatus = "Failed";
    automationMessage = `Resend email failed: ${safe.slice(0, 180)}`;
  }

  await persistLastTest(result);
  await AutomationLogModel.create({
    tenantId,
    createdBy: input.userId,
    moduleKey: "resend-email",
    moduleName: "resend-email",
    status: automationStatus,
    message: automationMessage,
    metadata: {},
  });
  await createAuditLog({
    tenantId,
    userId: input.userId,
    action: "integration.tested",
    entityType: "IntegrationConnection",
    entityId: "Resend",
    message: `Integration test: ${result.status}`,
    metadata: { provider: "Resend", slug: "resend", result: result.status },
  });

  return result;
}
