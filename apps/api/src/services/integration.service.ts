import { AutomationLogModel, IntegrationConnectionModel } from "@jobflow/database/models";
import { notifications } from "@jobflow/integrations";
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
import { providerFromSlug, slugForProvider } from "../utils/provider-slug";

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
    purpose: "Job folders, CV routing, document storage, and PDF exports.",
    requiredFor: ["folder-automation", "cv-routing", "pdf-export"],
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
    purpose: "Fallback delivery for digests, reminders, and reports.",
    requiredFor: ["daily-digest", "weekly-report", "follow-up-reminder"],
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
    purpose: "Workspace notifications (stub).",
    requiredFor: ["lifecycle-monitoring"],
  },
];

function maskSecret(raw: string): string {
  const t = raw.trim();
  if (t.length <= 8) return "••••••••";
  return `${t.slice(0, 3)}••••${t.slice(-4)}`;
}

function sanitizeConfigForStorage(provider: IntegrationProvider, config: Record<string, unknown>): Record<string, unknown> {
  const next = { ...config };
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
    next.passPreview = maskSecret(next.pass as string);
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
  return {
    ...entry,
    status,
    connectedEmail: row?.connectedEmail as string | undefined,
    accountName: row?.accountName as string | undefined,
    lastSyncAt: row?.lastSyncAt ? new Date(row.lastSyncAt as string | Date).toISOString() : undefined,
    syncStatus: row?.syncStatus as string | undefined,
    errorMessage:
      entry.provider === "Telegram" && !(cleanMeta.botTokenConfigured === true && cleanMeta.chatIdConfigured === true)
        ? "Telegram bot token or chat ID is missing. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Railway."
        : (row?.errorMessage as string | undefined),
    scopes: Array.isArray(row?.scopes) ? (row.scopes as string[]) : [],
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
  return value;
}

function rankIntegrationRow(row: Record<string, unknown>): number {
  const status = row.status as IntegrationStatus | undefined;
  const meta = (row.metadata as Record<string, unknown> | undefined) ?? {};
  const demo = meta.demoConnection === true || meta.reconnectRequired === true || row.connectedEmail === "oauth-demo-user@example.com";
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
        metadata: { stub: true, disconnectedAt: new Date().toISOString() },
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
    message: `Integration disconnected (stub): ${provider}`,
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
  const status: "connected" | "not_configured" | "needs_attention" = configured
    ? row?.status === "Needs Attention"
      ? "needs_attention"
      : "connected"
    : "not_configured";
  return {
    configured,
    botTokenConfigured,
    chatIdConfigured,
    status: status as "connected" | "not_configured" | "needs_attention",
    lastTest,
    lastNotificationAt,
    message: configured
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
    message: "✅ JobFlow Telegram notifications are connected.",
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
