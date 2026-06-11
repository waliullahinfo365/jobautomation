/**
 * Playwright session store — persists browser cookies + localStorage in MongoDB
 * so the user only needs to log in once per platform.
 *
 * Sessions are stored in IntegrationConnectionModel as provider = "playwright-session-<platform>"
 * and the session JSON is encrypted with the tenant encryption key.
 *
 * Optional **pinned egress proxy** (`metadata.playwrightProxyEncrypted`): LinkedIn sessions are
 * IP-bound; we persist the HTTP(S) proxy URL used when the session was created so workers keep
 * using the same egress even if `PROXY_URL` env changes between deploys.
 */

import { IntegrationConnectionModel } from "@jobflow/database/models";
import type { BrowserContext } from "playwright";

export type ApplyPlatform = "linkedin" | "indeed" | "greenhouse" | "lever" | "workday" | "generic";

const PROVIDER_PREFIX = "playwright-session";

function providerKey(platform: ApplyPlatform) {
  return `${PROVIDER_PREFIX}-${platform}`;
}

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? process.env.SESSION_ENCRYPTION_KEY ?? "default-dev-key-not-for-production";
  return createHash("sha256").update(raw).digest();
}

function encrypt(text: string): string {
  try {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch {
    return text;
  }
}

function decrypt(cipher: string): string {
  try {
    const [ivHex, encHex] = cipher.split(":");
    if (!ivHex || !encHex) return cipher;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = createDecipheriv("aes-256-cbc", getKey(), iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return cipher;
  }
}

/** How to update the per-session pinned Playwright proxy URL (encrypted at rest). */
export type SessionProxyPin =
  | { mode: "set"; url: string }
  | { mode: "clear" }
  | { mode: "keep" };

/** Save the browser storageState (cookies + origins) for a given tenant + platform */
export async function saveSession(input: {
  tenantId: string;
  platform: ApplyPlatform;
  storageState: object;
  /** Update or clear the pinned worker proxy; omit to leave existing metadata unchanged. */
  proxyPin?: SessionProxyPin;
  /** Strip session-expired markers (e.g. after cookie import or a successful apply capture). */
  clearSessionExpiredFlags?: boolean;
}): Promise<void> {
  const provider = providerKey(input.platform);
  const json = JSON.stringify(input.storageState);
  const encrypted = encrypt(json);

  const existing = (await IntegrationConnectionModel.findOne({
    tenantId: input.tenantId,
    provider,
  }).lean()) as Record<string, unknown> | null;

  const prev = ((existing?.metadata as Record<string, unknown>) ?? {}) as Record<string, unknown>;
  const meta: Record<string, unknown> = { ...prev, platform: input.platform, savedAt: new Date().toISOString() };

  if (input.clearSessionExpiredFlags) {
    delete meta.sessionExpired;
    delete meta.expiredAt;
  }

  if (input.proxyPin !== undefined) {
    if (input.proxyPin.mode === "set" && input.proxyPin.url.trim()) {
      meta.playwrightProxyEncrypted = encrypt(input.proxyPin.url.trim());
    } else if (input.proxyPin.mode === "clear") {
      delete meta.playwrightProxyEncrypted;
    }
  }

  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId: input.tenantId, provider },
    {
      $set: {
        tenantId: input.tenantId,
        provider,
        status: "Connected",
        accessTokenEncrypted: encrypted,
        lastSyncAt: new Date(),
        syncStatus: "OK",
        metadata: meta,
      },
    },
    { upsert: true, new: true }
  );
}

/** Decrypted HTTP(S) proxy URL pinned for this session, if any. */
export async function loadPlaywrightProxyUrl(input: {
  tenantId: string;
  platform: ApplyPlatform;
}): Promise<string | undefined> {
  const provider = providerKey(input.platform);
  const row = (await IntegrationConnectionModel.findOne({
    tenantId: input.tenantId,
    provider,
    status: "Connected",
  }).lean()) as Record<string, unknown> | null;

  const enc = (row?.metadata as Record<string, unknown> | undefined)?.playwrightProxyEncrypted;
  if (typeof enc !== "string" || !enc.trim()) return undefined;
  try {
    const url = decrypt(enc).trim();
    return url || undefined;
  } catch {
    return undefined;
  }
}

/** Load the browser storageState for a given tenant + platform. Returns null if not found. */
export async function loadSession(input: {
  tenantId: string;
  platform: ApplyPlatform;
}): Promise<object | null> {
  const provider = providerKey(input.platform);
  const row = await IntegrationConnectionModel.findOne({
    tenantId: input.tenantId,
    provider,
    status: "Connected",
  }).lean() as Record<string, unknown> | null;

  if (!row?.accessTokenEncrypted) return null;
  try {
    const json = decrypt(String(row.accessTokenEncrypted));
    return JSON.parse(json) as object;
  } catch {
    return null;
  }
}

/** Check if a valid session exists */
export async function hasSession(input: {
  tenantId: string;
  platform: ApplyPlatform;
}): Promise<boolean> {
  const session = await loadSession(input);
  return session !== null;
}

/** Delete a saved session (e.g. when it expires) */
export async function deleteSession(input: {
  tenantId: string;
  platform: ApplyPlatform;
}): Promise<void> {
  const provider = providerKey(input.platform);
  await IntegrationConnectionModel.deleteOne({ tenantId: input.tenantId, provider });
}

/** Capture the current browser context session state and save it to MongoDB */
export async function captureAndSaveSession(input: {
  tenantId: string;
  platform: ApplyPlatform;
  context: BrowserContext;
}): Promise<void> {
  const storageState = await input.context.storageState();
  await saveSession({
    tenantId: input.tenantId,
    platform: input.platform,
    storageState,
    clearSessionExpiredFlags: true,
  });
}
