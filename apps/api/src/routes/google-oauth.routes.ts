import { Router } from "express";
import { getGoogleAuthUrl, googleOAuthCallback, googleOAuthDemoCallback } from "../controllers/google-oauth.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateParams } from "../middleware/validate.middleware";
import { googleOAuthProviderParamSchema } from "../validators/google-oauth.validator";

/** Public OAuth redirect targets (no Bearer / tenant headers). */
export const googleOAuthPublicRouter = Router();
googleOAuthPublicRouter.get("/callback", googleOAuthCallback);
googleOAuthPublicRouter.get("/demo-callback", googleOAuthDemoCallback);

/** Authenticated: start Google OAuth for a provider slug. */
export const googleOAuthProtectedRouter = Router();
googleOAuthProtectedRouter.get(
  "/:provider/auth-url",
  requirePermission("integrations.connect"),
  validateParams(googleOAuthProviderParamSchema),
  getGoogleAuthUrl
);
