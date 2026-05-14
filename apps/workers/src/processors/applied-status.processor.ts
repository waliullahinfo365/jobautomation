import { ApplicationModel, AutomationLogModel, JobModel } from "@jobflow/database/models";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";

async function writeLog(input: {
  tenantId: string;
  status: "Success" | "Warning" | "Failed";
  message: string;
  operationId: string;
  relatedRecordId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      createdBy: "system",
      moduleKey: "applied-status",
      moduleName: "Applied Status",
      status: input.status,
      message: input.message,
      operationId: input.operationId,
      relatedRecordType: input.relatedRecordId ? "Application" : undefined,
      relatedRecordId: input.relatedRecordId,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    logger.error({ err: e }, "failed to write applied-status automation log");
  }
}

export async function processAppliedStatusJob(payload: {
  tenantId: string;
  applicationId: string;
  userId: string;
  operationId?: string;
}) {
  const started = Date.now();
  const operationId = payload.operationId ?? `applied-status-${Date.now()}`;
  const tenantId = payload.tenantId;

  logger.info({ tenantId, operationId, applicationId: payload.applicationId }, "applied-status processor started");

  try {
    // Look up the application
    const application = await ApplicationModel.findOne({
      _id: payload.applicationId,
      tenantId,
    }).lean() as Record<string, unknown> | null;

    if (!application) {
      logger.warn({ tenantId, operationId, applicationId: payload.applicationId }, "application not found");
      await writeLog({
        tenantId,
        status: "Warning",
        message: `Application ${payload.applicationId} not found.`,
        operationId,
        relatedRecordId: payload.applicationId,
      });
      return {
        moduleKey: "applied-status",
        operationId,
        status: "skipped",
        reason: "application-not-found",
      };
    }

    const currentStatus = String(application.applicationStatus ?? "");

    // Already in a terminal status — skip to avoid false positives
    if (["Applied", "Interview", "Offer", "Rejected", "Archived"].includes(currentStatus)) {
      logger.info({ tenantId, operationId, applicationId: payload.applicationId, currentStatus }, "application already in terminal status, skipping");
      await writeLog({
        tenantId,
        status: "Success",
        message: `Application already in status "${currentStatus}", no change needed.`,
        operationId,
        relatedRecordId: payload.applicationId,
        metadata: { currentStatus, skipped: true },
      });
      return {
        moduleKey: "applied-status",
        operationId,
        status: "skipped",
        reason: "already-applied-or-terminal",
        currentStatus,
      };
    }

    // Mark application as Applied
    const now = new Date();
    await ApplicationModel.findByIdAndUpdate(payload.applicationId, {
      applicationStatus: "Applied",
      dateApplied: application.dateApplied ?? now,
      appliedAutomationStatus: "Completed",
      appliedAutomationCompletedAt: now,
      lastStatusChangedAt: now,
      updatedBy: payload.userId,
    });

    // Sync the linked Job status if job is not already in a later stage
    const jobId = String(application.jobId ?? "");
    if (jobId) {
      const job = await JobModel.findOne({ _id: jobId, tenantId }).select("status").lean() as { status?: string } | null;
      const jobStatus = job?.status ?? "";
      if (["New", "Research", "Drafting", "Ready to Apply"].includes(jobStatus)) {
        await JobModel.findByIdAndUpdate(jobId, {
          status: "Applied",
          dateApplied: application.dateApplied ?? now,
          lastStatusChangedAt: now,
        });
      }
    }

    const durationMs = Date.now() - started;

    await writeLog({
      tenantId,
      status: "Success",
      message: `Application ${application.company ?? ""} — ${application.position ?? ""} marked as Applied.`,
      operationId,
      relatedRecordId: payload.applicationId,
      metadata: { previousStatus: currentStatus, jobId, durationMs },
    });

    await notifyAutomationEvent({
      tenantId,
      moduleKey: "applied-status",
      event: "status-updated",
      message: `✅ Application marked as Applied: ${application.company ?? ""} — ${application.position ?? ""}`,
      operationId,
      metadata: { applicationId: payload.applicationId, jobId, previousStatus: currentStatus },
    });

    logger.info({ tenantId, operationId, applicationId: payload.applicationId, durationMs }, "applied-status processor completed");

    return {
      moduleKey: "applied-status",
      operationId,
      status: "completed",
      applicationId: payload.applicationId,
      previousStatus: currentStatus,
      durationMs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ tenantId, operationId, applicationId: payload.applicationId, error: msg }, "applied-status processor failed");
    await writeLog({
      tenantId,
      status: "Failed",
      message: `Applied status update failed: ${msg}`,
      operationId,
      relatedRecordId: payload.applicationId,
    });
    throw error;
  }
}

/**
 * Bulk sweep: finds Drafted/Ready applications with a dateApplied set and marks them Applied.
 * Safe to run periodically to catch manual status changes that didn't trigger the worker.
 */
export async function sweepAppliedStatusForTenant(input: {
  tenantId: string;
  operationId?: string;
}) {
  const started = Date.now();
  const operationId = input.operationId ?? `applied-status-sweep-${Date.now()}`;
  const tenantId = input.tenantId;

  logger.info({ tenantId, operationId }, "applied-status sweep started");

  // Find applications that have a dateApplied but are still in draft/ready status
  const candidates = await ApplicationModel.find({
    tenantId,
    applicationStatus: { $in: ["Drafted", "Ready"] },
    dateApplied: { $exists: true, $ne: null },
  })
    .limit(200)
    .lean() as Array<Record<string, unknown>>;

  let updated = 0;
  let failed = 0;

  for (const app of candidates) {
    try {
      const now = new Date();
      await ApplicationModel.findByIdAndUpdate(app._id, {
        applicationStatus: "Applied",
        appliedAutomationStatus: "Completed",
        appliedAutomationCompletedAt: now,
        lastStatusChangedAt: now,
      });

      // Sync linked job
      const jobId = String(app.jobId ?? "");
      if (jobId) {
        const job = await JobModel.findOne({ _id: jobId, tenantId }).select("status").lean() as { status?: string } | null;
        if (["New", "Research", "Drafting", "Ready to Apply"].includes(job?.status ?? "")) {
          await JobModel.findByIdAndUpdate(jobId, { status: "Applied", dateApplied: app.dateApplied, lastStatusChangedAt: now });
        }
      }
      updated += 1;
    } catch {
      failed += 1;
    }
  }

  const durationMs = Date.now() - started;
  logger.info({ tenantId, operationId, scanned: candidates.length, updated, failed, durationMs }, "applied-status sweep completed");

  await AutomationLogModel.create({
    tenantId,
    createdBy: "system",
    moduleKey: "applied-status",
    moduleName: "Applied Status",
    status: failed > 0 ? "Warning" : "Success",
    message: `Applied-status sweep: ${candidates.length} scanned, ${updated} updated, ${failed} failed.`,
    operationId,
    metadata: { scanned: candidates.length, updated, failed, durationMs },
  });

  return { operationId, scanned: candidates.length, updated, failed, durationMs };
}
