import { randomUUID } from "node:crypto";
import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import type { Request } from "express";
import { processJobIntakeEmail } from "../services/job-intake.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";

export const intakeEmail = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const payload = req.body as JobIntakeEmailPayload;
  const result = await processJobIntakeEmail({
    tenantId,
    userId: req.user?.id ?? "system",
    payload,
  });
  return successResponse(res, result, "Job intake processed");
});

export const intakeTest = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const payload: JobIntakeEmailPayload = {
    provider: "test",
    providerMessageId: `test-${randomUUID()}`,
    providerThreadId: `thread-${Date.now()}`,
    from: req.body.from,
    subject: req.body.subject,
    bodyText: req.body.bodyText,
    receivedAt: new Date().toISOString(),
    raw: { source: "intake-test" },
  };

  const result = await processJobIntakeEmail({
    tenantId,
    userId: req.user?.id ?? "system",
    payload,
  });
  return successResponse(res, result, "Job intake test processed");
});
