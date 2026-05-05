import { AutomationLogModel, JobModel } from "@jobflow/database/models";
import type { JobExtractionResult } from "@jobflow/shared/types/job";
import { checkDuplicateJobWorker, findSimilarApplication } from "../lib/duplicate-job-check";

export type DuplicateProtectionProcessorPayload = {
  tenantId: string;
  jobId: string;
  operationId?: string;
  correlationId?: string;
};

export async function processDuplicateProtectionProcessor(payload: DuplicateProtectionProcessorPayload) {
  const operationId = payload.operationId ?? payload.correlationId ?? `duplicate-protection-${Date.now()}`;
  const started = Date.now();

  const job = await JobModel.findOne({ tenantId: payload.tenantId, _id: payload.jobId }).lean();
  if (!job) {
    throw new Error(`Job not found: ${payload.jobId}`);
  }

  const extraction: JobExtractionResult = {
    company: String((job as Record<string, unknown>).company ?? ""),
    position: String((job as Record<string, unknown>).position ?? ""),
    location: ((job as Record<string, unknown>).location as string | undefined) ?? undefined,
    jobUrl: ((job as Record<string, unknown>).jobUrl as string | undefined) ?? undefined,
    salaryRange: ((job as Record<string, unknown>).salaryRange as string | undefined) ?? undefined,
    source: ((job as Record<string, unknown>).source as string | undefined) ?? "manual",
    confidence: 1,
    description: ((job as Record<string, unknown>).description as string | undefined) ?? undefined,
    raw: { fromJobId: String((job as Record<string, unknown>)._id) },
  };

  let duplicateCheck = await checkDuplicateJobWorker(payload.tenantId, extraction);

  const isSelfMatch = duplicateCheck.duplicateOfJobId === String((job as Record<string, unknown>)._id);
  if (isSelfMatch) {
    duplicateCheck = {
      ...duplicateCheck,
      status: "Skipped",
      duplicateOfJobId: undefined,
      duplicateScore: 0,
      reasons: [...duplicateCheck.reasons, "Self match ignored"],
    };
  }

  const appMatch = await findSimilarApplication({
    tenantId: payload.tenantId,
    extraction,
    excludeJobId: payload.jobId,
  });

  await JobModel.findByIdAndUpdate(payload.jobId, {
    duplicateStatus:
      duplicateCheck.status === "Unique" || duplicateCheck.status === "Skipped"
        ? duplicateCheck.status === "Skipped"
          ? "Skipped"
          : "Unique"
        : duplicateCheck.status === "Duplicate"
          ? "Duplicate"
          : "Possible Duplicate",
    duplicateScore: duplicateCheck.duplicateScore,
    duplicateOfJobId: duplicateCheck.duplicateOfJobId,
  });

  const durationMs = Date.now() - started;

  await AutomationLogModel.create({
    tenantId: payload.tenantId,
    createdBy: "system",
    moduleKey: "duplicate-protection",
    moduleName: "duplicate-protection",
    status: "Success",
    message: "Duplicate check completed",
    operationId,
    relatedRecordType: "Job",
    relatedRecordId: payload.jobId,
    durationMs,
    metadata: {
      duplicate: duplicateCheck.status !== "Unique",
      duplicateCheck,
      matchedApplication: appMatch,
      jobId: payload.jobId,
    },
  });

  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "duplicate-protection",
    status: "completed",
    operationId,
    duplicate: duplicateCheck.status !== "Unique",
    duplicateCheck,
    matchedApplication: appMatch,
    message:
      duplicateCheck.status === "Unique"
        ? appMatch
          ? "Possible matching application found"
          : "No duplicate jobs found"
        : `Duplicate check: ${duplicateCheck.status}`,
  };
}
