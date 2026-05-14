import type { Request, Response } from "express";
import { authService, getGoogleLoginAuthorizationUrl, requestPasswordReset, confirmPasswordReset } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    workspaceName: req.body.workspaceName,
    req,
  });
  return successResponse(res, result, "Registered", 201);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser({
    email: req.body.email,
    password: req.body.password,
    req,
  });
  return successResponse(res, result, "Logged in");
});

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = await authService.logoutUser();
  return successResponse(res, result, "Logged out");
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;
  if (!userId || !tenantId) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
  }
  const result = await authService.getCurrentUser({ userId, tenantId });
  return successResponse(res, result, "Current user");
});

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await requestPasswordReset(req.body.email ?? "");
  return successResponse(res, { ok: true }, "If that email exists, a reset link has been sent");
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await confirmPasswordReset(req.body.token, req.body.password);
  return successResponse(res, { ok: true }, "Password reset successfully");
});

export const googleLoginUrlHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = getGoogleLoginAuthorizationUrl();
  return successResponse(res, result, "Google login URL");
});

export const googleLoginCallbackHandler = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  const appUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const failUrl = (msg: string) => `${appUrl}/login?google_error=${encodeURIComponent(msg)}`;

  if (error) {
    return res.redirect(failUrl(error));
  }
  if (!code || !state) {
    return res.redirect(failUrl("Missing code or state from Google"));
  }

  try {
    const result = await authService.loginWithGoogle({ code, state, req });
    const params = new URLSearchParams({
      token: result.accessToken,
      tenantId: result.tenant.id,
      userId: result.user.id,
    });
    return res.redirect(`${appUrl}/auth/callback?${params.toString()}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Google sign-in failed";
    return res.redirect(failUrl(msg));
  }
});
