import { Router } from "express";
import { loginHandler, registerHandler, googleLoginUrlHandler, googleLoginCallbackHandler } from "../controllers/auth.controller";
import { authRateLimiter } from "../middleware/rate-limit.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { loginBodySchema, registerBodySchema } from "../validators/auth.validator";

export const authPublicRoutes = Router();

authPublicRoutes.post("/register", authRateLimiter, validateBody(registerBodySchema), registerHandler);
authPublicRoutes.post("/login", authRateLimiter, validateBody(loginBodySchema), loginHandler);
authPublicRoutes.get("/google/url", authRateLimiter, googleLoginUrlHandler);
authPublicRoutes.get("/google/callback", googleLoginCallbackHandler);
