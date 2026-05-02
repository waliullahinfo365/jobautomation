import { IntegrationConnectionModel } from "@jobflow/database/models";
import { getGoogleScopesForProvider } from "@jobflow/shared/constants/googleScopes";
import type { IntegrationListItem, IntegrationProvider, IntegrationStatus } from "@jobflow/shared/types/integration";
import { GOOGLE_CLIENT_ID, GOOGLE_OAUTH_ENABLED, GOOGLE_REDIRECT_URI, getApiPublicBaseUrl } from "../config/google-oauth";
import { assertTenantId } from "./baseTenant.service";
import { createAuditLog } from "./audit-log.service";
import { findIntegrationListItem } from "./integration.service";
import { assertCanAddIntegration } from "./plan-limit.service";
import { encryptSecret } from "../utils/encryption";
import { createOAuthState, verifyOAuthState } from "../utils/oauth-state";
import { ApiError } from "../utils/errors";
import { isGoogleOAuthSlug, providerFromSlug, slugForProvider } from "../utils/provider-slug";

export type StubGoogleTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

/** TODO: replace with real `POST https://oauth2.googleapis.com/token` exchange. */
export function exchangeCodeForTokensStub(code: string): StubGoogleTokens {
  void code;
  return {
    access_token: "stub-google-access-token",
    refresh_token: "stub-google-refresh-token",
    expires_in: 3600,
    token_type: "Bearer",
  };
}

/** TODO: replace with `GET https://www.googleapis.com/oauth2/v2/userinfo` (or People API). */
export function getGoogleAccountProfileStub(_tokens: StubGoogleTokens): { email: string; name: string } {
  return {
    email: "oauth-demo-user@example.com",
    name: "OAuth Demo User",
  };
}

/**
 * Infer which Jobflow Google integration a scope set belongs to (first match wins).
 */
export function getProviderFromGoogleScope(scopesJoined: string): IntegrationProvider | null {
  const parts = scopesJoined.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  const has = (sub: string) => parts.some((p) => p.includes(sub));
  if (has("gmail")) return "Gmail";
  if (has("drive")) return "Google Drive";
  if (has("calendar")) return "Google Calendar";
  return null;
}

export async function getGoogleAuthorizationUrl(input: {
  tenantId: string;
  userId: string;
  providerSlug: string;
}): Promise<{ authorizationUrl: string; provider: string; oauthEnabled: boolean }> {
  const tenantId = assertTenantId(input.tenantId);
  if (!isGoogleOAuthSlug(input.providerSlug)) {
    throw new ApiError("Invalid Google integration provider", 422, "INVALID_PROVIDER");
  }
  const provider = providerFromSlug(input.providerSlug);
  if (!provider) throw new ApiError("Unknown provider", 422, "UNKNOWN_PROVIDER");

  const state = createOAuthState({ tenantId, userId: input.userId, provider });

  if (!GOOGLE_OAUTH_ENABLED) {
    const u = new URL(`${getApiPublicBaseUrl()}/integrations/google/demo-callback`);
    u.searchParams.set("state", state);
    return {
      authorizationUrl: u.toString(),
      provider: input.providerSlug,
      oauthEnabled: false,
    };
  }

  const scopes = getGoogleScopesForProvider(provider);
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  u.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", scopes.join(" "));
  u.searchParams.set("state", state);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");

  return {
    authorizationUrl: u.toString(),
    provider: input.providerSlug,
    oauthEnabled: true,
  };
}

export async function handleGoogleOAuthCallback(input: { code: string; state: string }): Promise<IntegrationListItem> {
  const payload = verifyOAuthState(input.state);
  const tenantId = assertTenantId(payload.tenantId);
  const provider = payload.provider;
  const userId = payload.userId;

  const googleProviders: IntegrationProvider[] = ["Gmail", "Google Drive", "Google Calendar"];
  if (!googleProviders.includes(provider)) {
    throw new ApiError("Invalid provider in OAuth state", 400, "OAUTH_STATE_INVALID");
  }

  const tokens = exchangeCodeForTokensStub(input.code);
  const profile = getGoogleAccountProfileStub(tokens);
  const scopes = getGoogleScopesForProvider(provider);

  const prev = (await IntegrationConnectionModel.findOne({ tenantId, provider }).lean()) as Record<
    string,
    unknown
  > | null;
  const hadActiveConnection =
    prev && (prev.status === "Connected" || prev.status === "Needs Attention");
  if (!hadActiveConnection) {
    await assertCanAddIntegration(tenantId);
  }

  const accessEnc = encryptSecret(tokens.access_token);
  const refreshEnc = encryptSecret(tokens.refresh_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const apiMode = GOOGLE_OAUTH_ENABLED ? "oauth-prepared" : "stub";

  const mergedMeta = {
    ...((prev?.metadata as Record<string, unknown>) ?? {}),
    oauthConnected: true,
    tokenType: tokens.token_type,
    apiMode,
    stub: apiMode === "stub",
  };

  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider },
    {
      $set: {
        tenantId,
        provider,
        status: "Connected" as IntegrationStatus,
        connectedEmail: profile.email,
        accountName: profile.name,
        scopes,
        errorMessage: undefined,
        syncStatus: "OK",
        lastSyncAt: new Date(),
        expiresAt,
        accessTokenEncrypted: accessEnc,
        refreshTokenEncrypted: refreshEnc,
        metadata: mergedMeta,
        updatedBy: userId,
      },
      $setOnInsert: {
        createdBy: userId,
      },
    },
    { upsert: true, new: true }
  );

  await createAuditLog({
    tenantId,
    userId,
    action: "integration.oauth_connected",
    entityType: "IntegrationConnection",
    entityId: provider,
    message: `Google OAuth connected (stub exchange): ${provider}`,
    metadata: { provider, slug: slugForProvider(provider), apiMode },
  });

  const item = await findIntegrationListItem({ tenantId, provider });
  if (!item) {
    throw new ApiError("Failed to load integration after OAuth", 500, "OAUTH_PERSIST_FAILED");
  }
  return item;
}
