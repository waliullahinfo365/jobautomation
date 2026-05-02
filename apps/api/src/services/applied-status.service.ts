import { randomUUID } from "node:crypto";
import { ApplicationModel, JobModel } from "@database/models";
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

  if (application.applicationStatus === "Applied" && application.dateApplied) {
    return application;
  }

  const idempotencyKey = `applied-status:${tenantId}:${input.applicationId}:${dateApplied.toISOString().slice(0, 10)}`;
  const followUpDate = application.followUpDate ?? new Date(dateApplied.getTime() + 5 * 24 * 60 * 60 * 1000);

  const updatedApplication = await ApplicationModel.findOneAndUpdate(
    { _id: input.applicationId, tenantId },
    {
      applicationStatus: "Applied",
      dateApplied,
      appliedAutomationStatus: "Completed",
      appliedAutomationCompletedAt: new Date(),
      lastStatusChangedAt: new Date(),
      followUpDate,
      followUpStatus: application.followUpStatus === "Not Needed" ? "Scheduled" : application.followUpStatus,
      updatedBy: input.userId,
    },
    { new: true }
  );
  if (!updatedApplication) throw new ApiError("Application not found", 404, "NOT_FOUND");

  if (updatedApplication.jobId) {
    await JobModel.findOneAndUpdate(
      { _id: updatedApplication.jobId, tenantId },
      {
        status: "Applied",
        dateApplied,
        applicationId: String(updatedApplication._id),
        lastStatusChangedAt: new Date(),
      }
    );
  }

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
