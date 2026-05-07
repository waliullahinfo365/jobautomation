import type { Request } from "express";
import { env } from "../config/env";
import * as googleOAuthService from "../services/google-oauth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import { ApiError } from "../utils/errors";

export const getGoogleAuthUrl = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const providerSlug = req.params.provider;
  const result = await googleOAuthService.getGoogleAuthorizationUrl({
    tenantId,
    userId,
    providerSlug,
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
  if (!state) {
    res.redirect(302, settingsErrorRedirect("missing OAuth state"));
    return;
  }
  if (!code) {
    res.redirect(302, settingsErrorRedirect("missing authorization code"));
    return;
  }
  try {
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
