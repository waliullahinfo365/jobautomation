import { Router } from "express";
import { loginHandler, registerHandler, forgotPasswordHandler, resetPasswordHandler, googleLoginUrlHandler, googleLoginCallbackHandler } from "../controllers/auth.controller";
import { authRateLimiter } from "../middleware/rate-limit.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { loginBodySchema, registerBodySchema, forgotPasswordBodySchema, resetPasswordBodySchema } from "../validators/auth.validator";

export const authPublicRoutes = Router();

authPublicRoutes.post("/register", authRateLimiter, validateBody(registerBodySchema), registerHandler);
authPublicRoutes.post("/login", authRateLimiter, validateBody(loginBodySchema), loginHandler);
authPublicRoutes.post("/forgot-password", authRateLimiter, validateBody(forgotPasswordBodySchema), forgotPasswordHandler);
authPublicRoutes.post("/reset-password", authRateLimiter, validateBody(resetPasswordBodySchema), resetPasswordHandler);
authPublicRoutes.get("/google/url", authRateLimiter, googleLoginUrlHandler);
authPublicRoutes.get("/google/callback", googleLoginCallbackHandler);
