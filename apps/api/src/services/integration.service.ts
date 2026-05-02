import { IntegrationConnectionModel } from "@database/models";
import type {
  IntegrationCatalogEntry,
  IntegrationHealthSummary,
  IntegrationListItem,
  IntegrationProvider,
  IntegrationStatus,
  IntegrationTestResult,
} from "@shared/types/integration";
import type { IntegrationTestStatus } from "@shared/constants/statuses";
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
  const status = (row?.status as IntegrationStatus) ?? "Not Connected";
  return {
    ...entry,
    status,
    connectedEmail: row?.connectedEmail as string | undefined,
    accountName: row?.accountName as string | undefined,
    lastSyncAt: row?.lastSyncAt ? new Date(row.lastSyncAt as string | Date).toISOString() : undefined,
    syncStatus: row?.syncStatus as string | undefined,
    errorMessage: row?.errorMessage as string | undefined,
    scopes: Array.isArray(row?.scopes) ? (row.scopes as string[]) : [],
    metadata: cleanMeta,
    lastTest,
  };
}

export async function listIntegrations(input: { tenantId: string }): Promise<IntegrationListItem[]> {
  const tenantId = assertTenantId(input.tenantId);
  const rows = await IntegrationConnectionModel.find({ tenantId }).lean();
  const byProvider = new Map<string, Record<string, unknown>>();
  for (const r of rows) {
    byProvider.set(String(r.provider), r as Record<string, unknown>);
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
    mergedMeta.stub = true;
  }

  const setDoc: Record<string, unknown> = {
    tenantId,
    provider,
    status: "Connected" as IntegrationStatus,
    connectedEmail: input.body.connectedEmail,
    accountName: input.body.accountName,
    scopes: input.body.scopes ?? [],
    errorMessage: undefined,
    syncStatus: "OK",
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
    if (provider === "OpenAI" || provider === "Claude") {
      const accessEnc = row?.accessTokenEncrypted;
      const meta = row?.metadata as Record<string, unknown> | undefined;
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
      message = `${provider} demo connection healthy (no external API call).`;
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
