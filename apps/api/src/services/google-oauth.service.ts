import { IntegrationConnectionModel } from "@jobflow/database/models";
import { getGoogleScopesForProvider, missingGoogleScopes } from "@jobflow/shared/constants/googleScopes";
import type { IntegrationListItem, IntegrationProvider, IntegrationStatus } from "@jobflow/shared/types/integration";
import { GOOGLE_CLIENT_ID, GOOGLE_OAUTH_ENABLED, GOOGLE_REDIRECT_URI } from "../config/google-oauth";
import { assertTenantId } from "./baseTenant.service";
import { createAuditLog } from "./audit-log.service";
import { findIntegrationListItem } from "./integration.service";
import { assertCanAddIntegration } from "./plan-limit.service";
import { encryptSecret } from "../utils/encryption";
import { createOAuthState, verifyOAuthState } from "../utils/oauth-state";
import { ApiError } from "../utils/errors";
import { isGoogleOAuthSlug, providerFromSlug, slugForProvider } from "../utils/provider-slug";
import { isGoogleDriveEnabled, isLegacyGmailOauthEnabled } from "@jobflow/shared/constants/legacy-integrations";

export type StubGoogleTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

export function exchangeCodeForTokensStub(code: string): StubGoogleTokens {
  void code;
  return {
    access_token: "stub-google-access-token",
    refresh_token: "stub-google-refresh-token",
    expires_in: 3600,
    token_type: "Bearer",
  };
}

export function getGoogleAccountProfileStub(_tokens: StubGoogleTokens): { email: string; name: string } {
  return {
    email: "oauth-demo-user@example.com",
    name: "OAuth Demo User",
  };
}

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

const GOOGLE_IDENTITY_SCOPES = ["openid", "email", "profile"];

async function exchangeCodeForTokensLive(code: string): Promise<GoogleTokenResponse> {
  if (!GOOGLE_OAUTH_ENABLED) {
    throw new ApiError("Google OAuth is not enabled on the API", 503, "GOOGLE_OAUTH_DISABLED");
  }
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientSecret) {
    throw new ApiError("Google OAuth client secret missing", 503, "GOOGLE_OAUTH_MISSING_SECRET");
  }
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: clientSecret,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Google token exchange failed: ${text.slice(0, 220)}`, 502, "GOOGLE_TOKEN_EXCHANGE_FAILED");
  }
  return (await response.json()) as GoogleTokenResponse;
}

async function getGoogleAccountProfileLive(accessToken: string): Promise<{ email: string; name: string }> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Google userinfo failed: ${text.slice(0, 220)}`, 502, "GOOGLE_USERINFO_FAILED");
  }
  const json = (await response.json()) as { email?: string; name?: string };
  if (!json.email) throw new ApiError("Google userinfo missing email", 502, "GOOGLE_USERINFO_INVALID");
  return {
    email: json.email,
    name: json.name ?? json.email,
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
}): Promise<{ authorizationUrl?: string; provider: string; oauthEnabled: boolean; message?: string }> {
  const tenantId = assertTenantId(input.tenantId);
  if (!isGoogleOAuthSlug(input.providerSlug)) {
    throw new ApiError("Invalid Google integration provider", 422, "INVALID_PROVIDER");
  }
  if (input.providerSlug === "google-drive" && !isGoogleDriveEnabled()) {
    throw new ApiError(
      "Google Drive is disabled. Documents are stored with Firebase Storage.",
      410,
      "GOOGLE_DRIVE_DISABLED"
    );
  }
  if (input.providerSlug === "gmail" && !isLegacyGmailOauthEnabled()) {
    throw new ApiError(
      "Direct Gmail OAuth is disabled. Connect email via Unipile in Settings.",
      410,
      "LEGACY_GMAIL_DISABLED"
    );
  }
  const provider = providerFromSlug(input.providerSlug);
  if (!provider) throw new ApiError("Unknown provider", 422, "UNKNOWN_PROVIDER");

  const state = createOAuthState({ tenantId, userId: input.userId, provider });

  if (!GOOGLE_OAUTH_ENABLED) {
    return {
      provider: input.providerSlug,
      oauthEnabled: false,
      message:
        "Google OAuth is not enabled on the API. This is only a demo connection and cannot create Drive folders, Calendar events, or read Gmail.",
    };
  }

  const scopes = Array.from(new Set([...getGoogleScopesForProvider(provider), ...GOOGLE_IDENTITY_SCOPES]));
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
    message: "Google OAuth is enabled.",
  };
}

export async function handleGoogleOAuthCallback(input: { code: string; state: string }): Promise<IntegrationListItem> {
  const payload = verifyOAuthState(input.state);
  const tenantId = assertTenantId(payload.tenantId);
  const provider = payload.provider;
  const userId = payload.userId;
  const providerSlug = slugForProvider(provider);

  const googleProviders: IntegrationProvider[] = ["Gmail", "Google Drive", "Google Calendar"];
  if (!googleProviders.includes(provider)) {
    throw new ApiError("Invalid provider in OAuth state", 400, "OAUTH_STATE_INVALID");
  }

  const tokens = GOOGLE_OAUTH_ENABLED
    ? await exchangeCodeForTokensLive(input.code)
    : exchangeCodeForTokensStub(input.code);
  let profile: { email?: string; name?: string };
  let emailFetched = false;
  try {
    profile = GOOGLE_OAUTH_ENABLED
      ? await getGoogleAccountProfileLive(tokens.access_token)
      : getGoogleAccountProfileStub(tokens as StubGoogleTokens);
    emailFetched = Boolean(profile.email);
  } catch {
    profile = { email: undefined, name: undefined };
    emailFetched = false;
  }
  const defaultScopes = getGoogleScopesForProvider(provider);
  const grantedScope = (tokens as GoogleTokenResponse).scope;
  const scopes = grantedScope
    ? grantedScope
        .split(/\s+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
    : defaultScopes;

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
  const refreshEnc = encryptSecret(tokens.refresh_token ?? "stub-google-refresh-token");
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);
  const apiMode = GOOGLE_OAUTH_ENABLED ? "oauth-live" : "stub";
  const isDemoConnection =
    apiMode !== "oauth-live" || (profile.email != null && profile.email === "oauth-demo-user@example.com");

  const missingAfterOAuth = missingGoogleScopes(scopes, defaultScopes);
  const scopeIncomplete = !isDemoConnection && missingAfterOAuth.length > 0;

  const mergedMeta: Record<string, unknown> = {
    ...((prev?.metadata as Record<string, unknown>) ?? {}),
    oauthConnected: true,
    tokenType: tokens.token_type ?? "Bearer",
    apiMode,
    stub: apiMode === "stub",
    demoConnection: isDemoConnection,
    reconnectRequired: isDemoConnection || scopeIncomplete,
    provider: providerSlug,
    enabled: !isDemoConnection && !scopeIncomplete,
    isActive: !isDemoConnection && !scopeIncomplete,
  };

  if (isDemoConnection) {
    const prevBanner = (prev?.metadata as Record<string, unknown> | undefined)?.reconnectBanner;
    mergedMeta.reconnectBanner =
      typeof prevBanner === "string" && prevBanner.trim().length > 0
        ? prevBanner
        : "Google reconnect required for live API access.";
    delete mergedMeta.missingScopes;
  } else if (missingAfterOAuth.length > 0) {
    mergedMeta.reconnectBanner = missingAfterOAuth.some((s) => s.includes("/auth/documents"))
      ? "Reconnect required — Google Docs scope missing."
      : "Reconnect required because Google scopes changed.";
    mergedMeta.missingScopes = missingAfterOAuth;
    mergedMeta.googleDocsScopeMissing = missingAfterOAuth.some((s) => s.includes("/auth/documents"));
  } else {
    delete mergedMeta.reconnectBanner;
    delete mergedMeta.missingScopes;
  }

  await IntegrationConnectionModel.updateMany(
    {
      tenantId,
      provider: { $in: [providerSlug, provider] },
      connectedEmail: "oauth-demo-user@example.com",
    },
    {
      $set: {
        status: "Disabled" as IntegrationStatus,
        syncStatus: "Demo / Not Live",
        errorMessage: "Superseded by live OAuth connection.",
        metadata: {
          ...((prev?.metadata as Record<string, unknown>) ?? {}),
          demoConnection: true,
          reconnectRequired: true,
          provider: providerSlug,
          enabled: false,
          isActive: false,
          supersededByLive: true,
        },
      },
    }
  );

  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider: { $in: [provider, providerSlug] } },
    {
      $set: {
        tenantId,
        provider,
        status: (isDemoConnection || scopeIncomplete ? "Needs Attention" : "Connected") as IntegrationStatus,
        connectedEmail: profile.email,
        accountName: profile.name ?? profile.email ?? "Google Account",
        scopes,
        errorMessage: isDemoConnection
          ? "Google reconnect required: demo connection cannot call Google APIs."
          : scopeIncomplete
            ? "Reconnect required because Google scopes changed."
            : undefined,
        syncStatus: isDemoConnection ? "Demo / Not Live" : scopeIncomplete ? "Scopes outdated — reconnect" : "OK",
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
    message: `Google OAuth connected: ${provider} (${apiMode})`,
    metadata: { provider, slug: slugForProvider(provider), apiMode },
  });

  console.info("[google-oauth/callback-save]", {
    provider: providerSlug,
    tenantId,
    userId,
    tokenExchangeSuccess: true,
    hasAccessToken: Boolean(tokens.access_token),
    hasRefreshToken: Boolean(tokens.refresh_token),
    scopesReceived: scopes,
    emailFetched,
    connectedEmail: profile.email ?? null,
    demoConnection: isDemoConnection,
  });

  const item = await findIntegrationListItem({ tenantId, provider });
  if (!item) {
    throw new ApiError("Failed to load integration after OAuth", 500, "OAUTH_PERSIST_FAILED");
  }
  return item;
}
