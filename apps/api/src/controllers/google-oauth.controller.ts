import type { Request } from "express";
import { getGoogleScopesForProvider } from "@jobflow/shared/constants/googleScopes";
import { env } from "../config/env";
import * as googleOAuthService from "../services/google-oauth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import { ApiError } from "../utils/errors";
import { verifyOAuthState } from "../utils/oauth-state";

export const getGoogleAuthUrl = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const providerSlug = req.params.provider;
  const result = await googleOAuthService.getGoogleAuthorizationUrl({
    tenantId,
    userId,
    providerSlug,
  });
  const provider = googleOAuthService.getProviderFromGoogleScope(
    getGoogleScopesForProvider(
      providerSlug === "gmail"
        ? "Gmail"
        : providerSlug === "google-drive"
          ? "Google Drive"
          : "Google Calendar"
    ).join(" ")
  );
  console.info("[google-oauth/auth-url]", {
    hasUserId: Boolean(userId && userId !== "system"),
    hasTenantId: Boolean(tenantId),
    userId,
    tenantId,
    provider: providerSlug,
    oauthEnabled: result.oauthEnabled,
    hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
    hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
    redirectUri: process.env.GOOGLE_REDIRECT_URI?.trim() || null,
    scopes:
      provider != null
        ? getGoogleScopesForProvider(provider)
        : getGoogleScopesForProvider(
            providerSlug === "gmail"
              ? "Gmail"
              : providerSlug === "google-drive"
                ? "Google Drive"
                : "Google Calendar"
          ),
  });
  return successResponse(res, result, "Google OAuth authorization URL");
});

function settingsErrorRedirect(message: string): string {
  return `${env.appUrl}/settings?integration=error&error=${encodeURIComponent(message)}`;
}

function settingsSuccessRedirect(providerSlug: string): string {
  return `${env.appUrl}/settings?integration=connected&provider=${encodeURIComponent(providerSlug)}`;
}

export const googleOAuthCallback = asyncHandler(async (req: Request, res) => {
  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");
  console.info("[google-oauth/callback]", {
    callbackReceived: true,
    hasCode: Boolean(code),
    hasState: Boolean(state),
  });
  if (!state) {
    res.redirect(302, settingsErrorRedirect("missing OAuth state"));
    return;
  }
  if (!code) {
    res.redirect(302, settingsErrorRedirect("missing authorization code"));
    return;
  }
  try {
    const statePayload = verifyOAuthState(state);
    console.info("[google-oauth/callback-state]", {
      providerFromState: statePayload.provider,
      tenantId: statePayload.tenantId,
      userId: statePayload.userId,
    });
    const item = await googleOAuthService.handleGoogleOAuthCallback({ code, state });
    res.redirect(302, settingsSuccessRedirect(item.slug));
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : "OAuth callback failed";
    res.redirect(302, settingsErrorRedirect(msg));
  }
});

export const googleOAuthDemoCallback = asyncHandler(async (req: Request, res) => {
  if (env.nodeEnv === "production") {
    res.redirect(302, settingsErrorRedirect("Google OAuth demo callback is disabled in production"));
    return;
  }
  const state = String(req.query.state ?? "");
  if (!state) {
    res.redirect(302, settingsErrorRedirect("missing OAuth state"));
    return;
  }
  try {
    const item = await googleOAuthService.handleGoogleOAuthCallback({
      code: "demo-oauth-code",
      state,
    });
    res.redirect(302, settingsSuccessRedirect(item.slug));
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : "Demo OAuth failed";
    res.redirect(302, settingsErrorRedirect(msg));
  }
});
