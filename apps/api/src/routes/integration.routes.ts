import { Router } from "express";
import {
  connectIntegration,
  disconnectIntegration,
  getIntegrationHealth,
  gmailReplyTest,
  gmailReplyWebhook,
  getTelegramStatus,
  listIntegrations,
  testTelegram,
  testIntegration,
} from "../controllers/integration.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams } from "../middleware/validate.middleware";
import { replyTestBodySchema } from "../validators/application-workflow.validator";
import { integrationConnectBodySchema, integrationProviderParamSchema } from "../validators/integration.validator";

export const integrationRoutes = Router();

integrationRoutes.get("/", requirePermission("integrations.read"), listIntegrations);
integrationRoutes.get("/health", requirePermission("integrations.read"), getIntegrationHealth);
integrationRoutes.get("/telegram/status", requirePermission("integrations.read"), getTelegramStatus);
integrationRoutes.post("/telegram/test", requirePermission("integrations.connect"), testTelegram);
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
integrationRoutes.post("/gmail/reply-webhook", gmailReplyWebhook);
integrationRoutes.post("/gmail/reply-test", requirePermission("integrations.connect"), validateBody(replyTestBodySchema), gmailReplyTest);
