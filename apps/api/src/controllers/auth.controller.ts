import type { Request, Response } from "express";
import { authService, getGoogleLoginAuthorizationUrl, requestPasswordReset, confirmPasswordReset } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { UserModel } from "@jobflow/database/models";
import { ApiError } from "../utils/errors";
import { securitySettingsSchema } from "../validators/auth.validator";

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

export const getPreferencesHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;
  if (!userId || !tenantId) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");
  const user = await UserModel.findOne({ _id: userId, tenantId }).lean();
  if (!user) throw new ApiError("User not found", 404, "NOT_FOUND");
  const u = user as Record<string, unknown>;
  return successResponse(res, (u.preferences as Record<string, unknown>) ?? {});
});

export const updatePreferencesHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;
  if (!userId || !tenantId) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");
  const allowed = ["phone", "location", "linkedinUrl", "websiteUrl", "yearsExperience", "currentTitle", "desiredSalary", "noticePeriod", "rightToWork", "requiresSponsorship"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) patch[`preferences.${key}`] = req.body[key];
  }
  if ("securitySettings" in req.body) {
    const parsed = securitySettingsSchema.safeParse(req.body.securitySettings);
    if (!parsed.success) throw new ApiError("Invalid security settings", 422, "VALIDATION_ERROR", parsed.error.flatten());
    patch["preferences.securitySettings"] = parsed.data;
  }
  if (Object.keys(patch).length === 0) throw new ApiError("No valid fields to update", 422, "VALIDATION_ERROR");
  const user = await UserModel.findOneAndUpdate({ _id: userId, tenantId }, { $set: patch }, { new: true }).lean();
  if (!user) throw new ApiError("User not found", 404, "NOT_FOUND");
  const u = user as Record<string, unknown>;
  return successResponse(res, (u.preferences as Record<string, unknown>) ?? {}, "Preferences updated");
});

export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;
  if (!userId || !tenantId) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");
  const user = await authService.updateCurrentUserProfile({
    userId,
    tenantId,
    name: req.body.name,
  });
  return successResponse(res, { user }, "Profile updated");
});

export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;
  if (!userId || !tenantId) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");
  const result = await authService.changePassword({
    userId,
    tenantId,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  return successResponse(res, result, "Password updated");
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
