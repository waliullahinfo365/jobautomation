import { normalizeGmailReply, verifyGmailWebhookStub } from "@jobflow/integrations/gmail/gmail.service";
import type { Request } from "express";
import * as integrationService from "../services/integration.service";
import { processEmailReply } from "../services/email-reply-detection.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";

export const listIntegrations = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const items = await integrationService.listIntegrations({ tenantId });
  return successResponse(res, items, "Integrations");
});

export const getIntegrationHealth = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const health = await integrationService.getIntegrationHealth({ tenantId });
  return successResponse(res, health, "Integration health");
});

export const connectIntegration = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const item = await integrationService.connectIntegration({
    tenantId,
    userId,
    providerSlug: req.params.provider,
    body: req.body ?? {},
  });
  return successResponse(res, item, "Integration connected");
});

export const disconnectIntegration = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const item = await integrationService.disconnectIntegration({
    tenantId,
    userId,
    providerSlug: req.params.provider,
  });
  return successResponse(res, item, "Integration disconnected");
});

export const testIntegration = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const result = await integrationService.testIntegration({
    tenantId,
    userId,
    providerSlug: req.params.provider,
  });
  return successResponse(res, result, "Integration test complete");
});

export const getTelegramStatus = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const status = await integrationService.getTelegramStatus({ tenantId });
  return successResponse(res, status, "Telegram status");
});

export const testTelegram = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const result = await integrationService.testTelegramNotification({ tenantId, userId });
  return successResponse(res, result, "Telegram test complete");
});

export const testSlack = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const result = await integrationService.testSlackNotification({ tenantId, userId });
  return successResponse(res, result, "Slack test complete");
});

export const getResendStatus = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const status = await integrationService.getResendEnvStatus({ tenantId });
  return successResponse(res, status, "Resend status");
});

export const testResend = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const body = (req.body ?? {}) as { to?: string };
  const result = await integrationService.testResendNotification({
    tenantId,
    userId,
    to: typeof body.to === "string" ? body.to : undefined,
    userEmail: typeof req.user?.email === "string" ? req.user.email : undefined,
  });
  return successResponse(res, result, "Resend test complete");
});

export const gmailReplyWebhook = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const isValid = verifyGmailWebhookStub(req.body);
  if (!isValid) return successResponse(res, { accepted: false }, "Invalid webhook payload");
  const payload = normalizeGmailReply(req.body);
  const result = await processEmailReply({ tenantId, payload });
  return successResponse(res, result, "Reply webhook processed");
});

export const gmailReplyTest = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const payload = normalizeGmailReply({ provider: "test", ...req.body });
  const result = await processEmailReply({ tenantId, payload });
  return successResponse(res, result, "Reply test processed");
});
