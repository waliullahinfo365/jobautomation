import { normalizeGmailReply, verifyGmailWebhook } from "@jobflow/integrations/gmail/gmail.service";
import type { Request } from "express";
import * as integrationService from "../services/integration.service";
import { processEmailReply } from "../services/email-reply-detection.service";
import { scanGmailInbox } from "../services/gmail-scan.service";
import { processJobIntakeEmail } from "../services/job-intake.service";
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

export const gmailScanInbox = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const body = req.body as Record<string, unknown>;

  const maxMessages = Math.min(Number(body.maxMessages ?? 100), 200);
  const daysBack = Math.min(Number(body.daysBack ?? 14), 60);
  const labelFilter = typeof body.labelFilter === "string" && body.labelFilter ? body.labelFilter : undefined;

  const scan = await scanGmailInbox({ tenantId, maxMessages, daysBack, labelFilter });

  // Run each payload through the full intake pipeline
  const results = await Promise.allSettled(
    scan.payloads.map((payload) =>
      processJobIntakeEmail({ tenantId, userId, payload })
    )
  );

  const created: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value.status === "created") created.push(r.value.jobId ?? "");
      else skipped.push(r.value.status);
    } else {
      failed.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
    }
  }

  return successResponse(res, {
    scanned: scan.scanned,
    processed: scan.payloads.length,
    created: created.length,
    skipped: skipped.length,
    failed: failed.length,
    scanErrors: scan.errors,
    intakeErrors: failed,
    createdJobIds: created.filter(Boolean),
  }, "Gmail inbox scan complete");
});

export const gmailReplyWebhook = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const verification = await verifyGmailWebhook(req.body, req.headers.authorization);
  if (!verification.valid) return successResponse(res, { accepted: false, reason: verification.reason }, "Invalid webhook payload");
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
