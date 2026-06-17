import { randomUUID } from "node:crypto";
import { documentApplicationEvent } from "@jobflow/database";
import { ApplicationModel } from "@jobflow/database/models";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

export async function markApplicationApplied(input: {
  tenantId: string;
  applicationId: string;
  userId: string;
  appliedAt?: Date;
  operationId?: string;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const dateApplied = input.appliedAt ?? new Date();

  const application = await findTenantScopedById(ApplicationModel, tenantId, input.applicationId);
  if (!application) throw new ApiError("Application not found", 404, "NOT_FOUND");

  const jobId = String((application as { jobId?: string }).jobId ?? "");
  if (!jobId) {
    throw new ApiError("Application is not linked to a job", 400, "JOB_ID_REQUIRED");
  }

  if (application.applicationStatus === "Applied" && application.dateApplied) {
    return application;
  }

  const idempotencyKey = `applied-status:${tenantId}:${input.applicationId}:${dateApplied.toISOString().slice(0, 10)}`;

  const updatedApplication = await documentApplicationEvent({
    tenantId,
    userId: input.userId,
    jobId,
    applicationId: input.applicationId,
    applicationStatus: "Applied",
    applyMethod: "manual",
    appliedAt: dateApplied,
  });

  await createAutomationLog({
    tenantId,
    moduleKey: "applied-status",
    moduleName: "Applied Status",
    status: "Success",
    message: "Application marked applied",
    relatedRecordType: "Application",
    relatedRecordId: input.applicationId,
    idempotencyKey,
    operationId,
  });

  return updatedApplication;
}
