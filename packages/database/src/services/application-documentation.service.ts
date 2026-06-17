import { ApplicationModel, JobModel } from "../models";
import { applicationStatusToPipelineStage } from "@jobflow/shared/constants/pipeline";
import {
  addDays,
  followUpPolicyForApplicationStatus,
  shouldSyncJobPipelineFromApplicationStatus,
  type ApplyMethod,
} from "@jobflow/shared/constants/application-documentation";

export type StatusHistoryEntry = {
  status: string;
  at: Date;
  source: string;
  notes?: string;
};

export type DocumentApplicationEventInput = {
  tenantId: string;
  userId: string;
  jobId: string;
  applicationStatus: string;
  applyMethod: ApplyMethod;
  applicationId?: string;
  appliedAt?: Date;
  followUpDate?: Date;
  notes?: string;
  documentIds?: string[];
  company?: string;
  position?: string;
  source?: string;
  jobUrl?: string;
  contactEmail?: string;
  responseStatus?: string;
};

/** Write-through: Application status drives Job.pipelineStage when policy allows. */
export async function syncJobPipelineFromApplication(input: {
  tenantId: string;
  jobId: string;
  applicationStatus: string;
  userId?: string;
}) {
  if (!shouldSyncJobPipelineFromApplicationStatus(input.applicationStatus)) {
    return;
  }

  const stage = applicationStatusToPipelineStage(input.applicationStatus);
  const statusPatch: Record<string, string> = { pipelineStage: stage };
  switch (stage) {
    case "Applied":
      statusPatch.status = "Applied";
      break;
    case "Interview":
      statusPatch.status = "Interview";
      break;
    case "Offer":
      statusPatch.status = "Offer";
      break;
    case "Closed":
      statusPatch.status = "Rejected";
      break;
    case "Ready":
      statusPatch.status = "Ready to Apply";
      break;
    default:
      break;
  }

  await JobModel.findOneAndUpdate(
    { _id: input.jobId, tenantId: input.tenantId },
    { $set: { ...statusPatch, lastStatusChangedAt: new Date(), updatedBy: input.userId ?? "system" } }
  );
}

function buildFollowUpFields(input: {
  applicationStatus: string;
  appliedAt: Date;
  followUpDate?: Date;
}): { followUpDate?: Date; followUpStatus?: string } {
  const policy = followUpPolicyForApplicationStatus(input.applicationStatus);
  if (policy.kind === "none") {
    return {};
  }
  const followUpDate = input.followUpDate ?? addDays(input.appliedAt, policy.days);
  if (policy.kind === "schedule") {
    return { followUpDate, followUpStatus: "Scheduled" };
  }
  return { followUpDate, followUpStatus: "Not Needed" };
}

/**
 * Single entry point for documenting application status changes.
 * Upserts one Application per jobId and syncs Job.pipelineStage when appropriate.
 */
export async function documentApplicationEvent(input: DocumentApplicationEventInput) {
  const now = new Date();
  const appliedAt = input.appliedAt ?? now;
  const status = input.applicationStatus;

  const job = (await JobModel.findOne({ _id: input.jobId, tenantId: input.tenantId }).lean()) as
    | Record<string, unknown>
    | null;
  if (!job) {
    throw new Error(`Job not found: ${input.jobId}`);
  }

  const company = input.company?.trim() || String(job.company ?? "");
  const position = input.position?.trim() || String(job.position ?? job.title ?? "");
  if (!company || !position) {
    throw new Error("company and position are required to document an application");
  }

  const historyEntry: StatusHistoryEntry = {
    status,
    at: now,
    source: input.applyMethod,
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
  };

  const followUpFields = buildFollowUpFields({
    applicationStatus: status,
    appliedAt,
    followUpDate: input.followUpDate,
  });

  const baseSet: Record<string, unknown> = {
    applicationStatus: status,
    applyMethod: input.applyMethod,
    lastStatusChangedAt: now,
    updatedBy: input.userId,
    company,
    position,
    jobId: input.jobId,
    ...(input.source ? { source: input.source } : {}),
    ...(input.jobUrl ? { jobUrl: input.jobUrl } : job.jobUrl ? { jobUrl: String(job.jobUrl) } : {}),
    ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
    ...(input.responseStatus ? { responseStatus: input.responseStatus } : {}),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    ...(input.documentIds?.length ? { documentIds: input.documentIds } : {}),
    ...followUpFields,
  };

  if (status === "Applied") {
    baseSet.dateApplied = appliedAt;
    baseSet.appliedAutomationStatus = "Completed";
    baseSet.appliedAutomationCompletedAt = now;
  }

  let existing = null as Record<string, unknown> | null;
  if (input.applicationId) {
    existing = (await ApplicationModel.findOne({ _id: input.applicationId, tenantId: input.tenantId }).lean()) as
      | Record<string, unknown>
      | null;
  }
  if (!existing) {
    existing = (await ApplicationModel.findOne({ tenantId: input.tenantId, jobId: input.jobId }).lean()) as
      | Record<string, unknown>
      | null;
  }

  let application;
  if (existing) {
    application = await ApplicationModel.findOneAndUpdate(
      { _id: existing._id, tenantId: input.tenantId },
      {
        $set: baseSet,
        $push: { statusHistory: historyEntry },
      },
      { new: true }
    );
  } else {
    application = await ApplicationModel.create({
      tenantId: input.tenantId,
      createdBy: input.userId,
      responseStatus: input.responseStatus ?? "No Response",
      followUpStatus: followUpFields.followUpStatus ?? "Not Needed",
      statusHistory: [historyEntry],
      ...baseSet,
    });
  }

  if (!application) {
    throw new Error("Failed to document application event");
  }

  if (shouldSyncJobPipelineFromApplicationStatus(status)) {
    await syncJobPipelineFromApplication({
      tenantId: input.tenantId,
      jobId: input.jobId,
      applicationStatus: status,
      userId: input.userId,
    });
  }

  const jobPatch: Record<string, unknown> = {
    applicationId: String(application._id),
    updatedBy: input.userId,
  };
  if (status === "Applied") {
    jobPatch.dateApplied = appliedAt;
  }

  await JobModel.findOneAndUpdate({ _id: input.jobId, tenantId: input.tenantId }, { $set: jobPatch });

  return application;
}
