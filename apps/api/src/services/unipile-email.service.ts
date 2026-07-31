import { IntegrationConnectionModel } from "@jobflow/database/models";
import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import { env } from "../config/env";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "./baseTenant.service";
import { processJobIntakeEmail } from "./job-intake.service";
import {
  createUnipileHostedAuthLink,
  getUnipileAccount,
  getUnipileEmail,
  listUnipileEmails,
  unipileConfigured,
  type UnipileEmail,
} from "./unipile.client";

export const UNIPILE_EMAIL_PROVIDER = "Unipile Email";

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function encodeUnipileConnectName(tenantId: string, userId: string): string {
  return `${tenantId}|${userId}`;
}

export function decodeUnipileConnectName(name: string): { tenantId: string; userId: string } | null {
  const parts = name.split("|");
  if (parts.length < 2) return null;
  const tenantId = parts[0]?.trim();
  const userId = parts.slice(1).join("|").trim();
  if (!tenantId || !userId) return null;
  return { tenantId, userId };
}

function publicApiBase(): string {
  const base = (env.apiPublicUrl || process.env.API_URL || "").replace(/\/$/, "");
  if (!base) throw new ApiError("API_PUBLIC_URL is required for Unipile callbacks", 500, "CONFIG_ERROR");
  return base;
}

function webAppBase(): string {
  return (env.appUrl || "http://localhost:3000").replace(/\/$/, "");
}

/** Heuristic: likely a job-alert email worth intake. */
export function looksLikeJobAlertEmail(input: { from: string; subject: string; bodyText: string }): boolean {
  const hay = `${input.from} ${input.subject} ${input.bodyText}`.toLowerCase();
  const keywords = [
    "linkedin",
    "indeed",
    "stepstone",
    "xing",
    "glassdoor",
    "monster",
    "job alert",
    "job recommendation",
    "new jobs",
    "stellenanzeige",
    "job alert",
    "bewerbung",
    "easy apply",
    "you have a new job",
    "jobs for you",
    "recommended jobs",
  ];
  return keywords.some((k) => hay.includes(k));
}

export function mapUnipileEmailToIntakePayload(email: UnipileEmail): JobIntakeEmailPayload {
  const from =
    email.from_attendee?.identifier ||
    email.from_attendee?.display_name ||
    "unknown@unknown";
  const subject = String(email.subject ?? "").trim() || "(no subject)";
  const bodyRaw = String(email.body_plain || email.body || "").trim();
  const bodyText = bodyRaw.includes("<") ? stripHtml(bodyRaw) : bodyRaw;
  const providerMessageId = String(
    email.id || email.email_id || email.message_id || email.provider_id || `${from}:${subject}:${email.date ?? ""}`
  );

  return {
    provider: "unipile",
    providerMessageId,
    providerThreadId: email.message_id ? String(email.message_id) : undefined,
    from,
    subject,
    bodyText: bodyText || subject,
    receivedAt: email.date ? new Date(email.date).toISOString() : new Date().toISOString(),
    labels: email.folders ?? (email.role ? [email.role] : undefined),
    raw: email as unknown as Record<string, unknown>,
  };
}

export async function createUnipileEmailConnectLink(input: {
  tenantId: string;
  userId: string;
}): Promise<{ url: string; expiresInMinutes: number }> {
  if (!unipileConfigured()) {
    throw new ApiError("Unipile is not configured on the server", 503, "UNIPILE_NOT_CONFIGURED");
  }
  const tenantId = assertTenantId(input.tenantId);
  const apiBase = publicApiBase();
  const webBase = webAppBase();
  const expiresInMinutes = 30;

  const res = await createUnipileHostedAuthLink({
    name: encodeUnipileConnectName(tenantId, input.userId),
    notifyUrl: `${apiBase}/integrations/unipile/notify`,
    successRedirectUrl: `${webBase}/settings?section=Integrations&unipile=connected`,
    failureRedirectUrl: `${webBase}/settings?section=Integrations&unipile=failed`,
    providers: ["GOOGLE"],
    expiresInMinutes,
  });

  if (!res.url) throw new ApiError("Unipile did not return a connect URL", 502, "UNIPILE_ERROR");
  return { url: res.url, expiresInMinutes };
}

export async function upsertUnipileEmailConnection(input: {
  tenantId: string;
  userId: string;
  accountId: string;
  status?: "Connected" | "Needs Attention";
}) {
  const tenantId = assertTenantId(input.tenantId);
  let connectedEmail = "";
  let accountName = "Gmail via Unipile";
  try {
    const account = await getUnipileAccount(input.accountId);
    connectedEmail = String(
      account.email ||
        account.username ||
        (account as { connection_params?: { mail?: { username?: string } } }).connection_params?.mail?.username ||
        ""
    );
    accountName = connectedEmail || String(account.name || accountName);
  } catch {
    // Account fetch is best-effort
  }

  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider: UNIPILE_EMAIL_PROVIDER },
    {
      tenantId,
      provider: UNIPILE_EMAIL_PROVIDER,
      status: input.status ?? "Connected",
      connectedEmail: connectedEmail || undefined,
      accountName,
      metadata: {
        unipileAccountId: input.accountId,
        connectedAt: new Date().toISOString(),
        source: "unipile-hosted-auth",
      },
      syncStatus: "OK",
      errorMessage: undefined,
      updatedBy: input.userId,
      createdBy: input.userId,
    },
    { upsert: true, new: true }
  );
}

export async function getUnipileEmailStatus(tenantId: string) {
  const row = (await IntegrationConnectionModel.findOne({
    tenantId: assertTenantId(tenantId),
    provider: UNIPILE_EMAIL_PROVIDER,
  }).lean()) as Record<string, unknown> | null;

  if (!row) {
    return {
      connected: false as const,
      configured: unipileConfigured(),
    };
  }

  const meta = (row.metadata as Record<string, unknown>) ?? {};
  return {
    connected: row.status === "Connected",
    configured: unipileConfigured(),
    status: String(row.status ?? ""),
    connectedEmail: row.connectedEmail ? String(row.connectedEmail) : null,
    accountName: row.accountName ? String(row.accountName) : null,
    accountId: meta.unipileAccountId ? String(meta.unipileAccountId) : null,
    lastSyncAt: row.lastSyncAt ? String(row.lastSyncAt) : null,
  };
}

export async function disconnectUnipileEmail(input: { tenantId: string; userId: string }) {
  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId: assertTenantId(input.tenantId), provider: UNIPILE_EMAIL_PROVIDER },
    {
      status: "Disabled",
      syncStatus: "Disconnected",
      updatedBy: input.userId,
      $unset: { "metadata.unipileAccountId": 1 },
    }
  );
}

async function loadConnectedAccount(tenantId: string): Promise<{ accountId: string; userId: string } | null> {
  const row = (await IntegrationConnectionModel.findOne({
    tenantId: assertTenantId(tenantId),
    provider: UNIPILE_EMAIL_PROVIDER,
    status: "Connected",
  }).lean()) as Record<string, unknown> | null;
  if (!row) return null;
  const meta = (row.metadata as Record<string, unknown>) ?? {};
  const accountId = String(meta.unipileAccountId ?? "").trim();
  if (!accountId) return null;
  return { accountId, userId: String(row.updatedBy || row.createdBy || "system") };
}

export async function scanUnipileEmailsForTenant(input: {
  tenantId: string;
  userId?: string;
  limit?: number;
  forceAll?: boolean;
}) {
  const intakeEnabled = process.env.UNIPILE_EMAIL_INTAKE_ENABLED !== "false";
  if (!intakeEnabled) {
    throw new ApiError("Unipile email intake is disabled", 503, "UNIPILE_INTAKE_DISABLED");
  }
  if (!unipileConfigured()) {
    throw new ApiError("Unipile is not configured", 503, "UNIPILE_NOT_CONFIGURED");
  }

  const connected = await loadConnectedAccount(input.tenantId);
  if (!connected) throw new ApiError("Connect Unipile email first", 422, "INTEGRATION_NOT_CONNECTED");

  const listed = await listUnipileEmails({ accountId: connected.accountId, limit: input.limit ?? 25 });
  const items = listed.items ?? listed.data ?? (Array.isArray(listed) ? (listed as UnipileEmail[]) : []);

  let processed = 0;
  let skipped = 0;
  let created = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const emailId = String(item.id || item.email_id || "").trim();
      let full = item;
      if (emailId) {
        try {
          full = await getUnipileEmail({ emailId, accountId: connected.accountId });
        } catch {
          full = item;
        }
      }
      const payload = mapUnipileEmailToIntakePayload(full);
      if (!input.forceAll && !looksLikeJobAlertEmail(payload)) {
        skipped++;
        continue;
      }
      const result = await processJobIntakeEmail({
        tenantId: input.tenantId,
        userId: input.userId || connected.userId,
        payload,
      });
      processed++;
      if (result.status === "created" || result.jobId) created++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  await IntegrationConnectionModel.updateOne(
    { tenantId: input.tenantId, provider: UNIPILE_EMAIL_PROVIDER },
    { lastSyncAt: new Date(), syncStatus: "OK" }
  );

  return {
    accountId: connected.accountId,
    listed: items.length,
    processed,
    skipped,
    created,
    errors: errors.slice(0, 5),
  };
}

export async function processUnipileMailWebhook(body: Record<string, unknown>) {
  const event = String(body.event || body.type || "").toLowerCase();
  if (event && !["mail_received", "email.new", "mail_moved"].includes(event) && body.email_id == null && !body.email) {
    return { ignored: true, reason: `event:${event || "unknown"}` };
  }

  // Ignore outbound sent mail for job intake
  if (event === "mail_sent") return { ignored: true, reason: "mail_sent" };

  const accountId = String(body.account_id ?? "").trim();
  if (!accountId) return { ignored: true, reason: "missing_account_id" };

  const row = (await IntegrationConnectionModel.findOne({
    provider: UNIPILE_EMAIL_PROVIDER,
    status: "Connected",
    "metadata.unipileAccountId": accountId,
  }).lean()) as Record<string, unknown> | null;

  if (!row) return { ignored: true, reason: "unknown_account" };

  const tenantId = String(row.tenantId);
  const userId = String(row.updatedBy || row.createdBy || "system");

  let email: UnipileEmail;
  if (body.email && typeof body.email === "object") {
    email = body.email as UnipileEmail;
  } else if (body.body || body.subject || body.email_id) {
    email = body as UnipileEmail;
  } else {
    return { ignored: true, reason: "no_email_payload" };
  }

  // Prefer full fetch when only id is present
  const emailId = String(email.id || email.email_id || body.email_id || "").trim();
  if (emailId && !email.body && !email.body_plain) {
    try {
      email = await getUnipileEmail({ emailId, accountId });
    } catch {
      // keep partial
    }
  }

  const payload = mapUnipileEmailToIntakePayload({ ...email, account_id: accountId });
  if (!looksLikeJobAlertEmail(payload)) {
    return { ignored: true, reason: "not_job_alert", subject: payload.subject };
  }

  if (process.env.UNIPILE_EMAIL_INTAKE_ENABLED === "false") {
    return { ignored: true, reason: "intake_disabled" };
  }

  const result = await processJobIntakeEmail({ tenantId, userId, payload });
  await IntegrationConnectionModel.updateOne(
    { _id: row._id },
    { lastSyncAt: new Date(), syncStatus: "OK" }
  );

  return {
    ignored: false,
    tenantId,
    jobId: result.jobId,
    status: result.status,
  };
}
