import { Router } from "express";
import {
  startLinkedInLogin,
  getLinkedInSessionStatus,
  deleteLinkedInSession,
  importLinkedInCookies,
} from "../controllers/linkedin-session.controller";
import {
  connectIntegration,
  disconnectIntegration,
  getIntegrationHealth,
  gmailReplyTest,
  gmailReplyWebhook,
  getResendStatus,
  getTelegramStatus,
  listIntegrations,
  testResend,
  testSlack,
  testTelegram,
  testIntegration,
} from "../controllers/integration.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { replyTestBodySchema } from "../validators/application-workflow.validator";
import {
  integrationConnectBodySchema,
  integrationProviderParamSchema,
  resendTestBodySchema,
} from "../validators/integration.validator";

export const integrationRoutes = Router();

integrationRoutes.get("/", requirePermission("integrations.read"), listIntegrations);
integrationRoutes.get("/health", requirePermission("integrations.read"), getIntegrationHealth);
integrationRoutes.get("/telegram/status", requirePermission("integrations.read"), getTelegramStatus);
integrationRoutes.post("/telegram/test", requirePermission("integrations.connect"), testTelegram);
integrationRoutes.post("/slack/test", requirePermission("integrations.connect"), testSlack);
integrationRoutes.get("/resend/status", requirePermission("integrations.read"), getResendStatus);
integrationRoutes.post(
  "/resend/test",
  requirePermission("integrations.connect"),
  validateBody(resendTestBodySchema),
  testResend
);
integrationRoutes.post(
  "/:provider/connect",
  requirePermission("integrations.connect"),
  validateParams(integrationProviderParamSchema),
  validateBody(integrationConnectBodySchema),
  connectIntegration
);
integrationRoutes.post(
  "/:provider/disconnect",
  requirePermission("integrations.disconnect"),
  validateParams(integrationProviderParamSchema),
  disconnectIntegration
);
integrationRoutes.post(
  "/:provider/test",
  requirePermission("integrations.connect"),
  validateParams(integrationProviderParamSchema),
  testIntegration
);
integrationRoutes.post("/linkedin/session", requirePermission("integrations.connect"), startLinkedInLogin);
integrationRoutes.post("/linkedin/session/cookies", requirePermission("integrations.connect"), importLinkedInCookies);
integrationRoutes.get("/linkedin/session", requirePermission("integrations.read"), getLinkedInSessionStatus);
integrationRoutes.delete("/linkedin/session", requirePermission("integrations.disconnect"), deleteLinkedInSession);

integrationRoutes.post("/gmail/reply-webhook", gmailReplyWebhook);
integrationRoutes.post("/gmail/reply-test", requirePermission("integrations.connect"), validateBody(replyTestBodySchema), gmailReplyTest);
