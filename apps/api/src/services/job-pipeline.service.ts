import { ApplicationModel, DocumentModel, InterviewModel, JobModel } from "@jobflow/database/models";
import { jobPipelineStages, type JobPipelineStage } from "@jobflow/shared/constants/pipeline";

/** Demo/test jobs excluded from Today and pipeline counts. */
export function buildTestJobFilter(): Record<string, unknown> {
  return {
    $or: [
      { source: "test" },
      { intakeSource: "test" },
      { providerMessageId: { $regex: "^test-" } },
      { "rawSourceData.extractionAi.usedStub": true },
      { "rawSourceData.extractionRaw.from": { $regex: "jobs\\.demo\\.jobflow\\.ai", $options: "i" } },
    ],
  };
}

export function baseTrackedJobsFilter(tenantId: string): Record<string, unknown> {
  return {
    tenantId,
    status: { $nin: ["Archived"] },
    $nor: [buildTestJobFilter()],
  };
}

export async function countJobsToReviewToday(tenantId: string): Promise<number> {
  return JobModel.countDocuments({
    ...baseTrackedJobsFilter(tenantId),
    status: "New",
    reviewStatus: { $nin: ["rejected", "saved", "apply_next"] },
  });
}

export async function getPipelineCounts(tenantId: string): Promise<Record<JobPipelineStage, number>> {
  const base = baseTrackedJobsFilter(tenantId);
  const [
    newCount,
    savedCount,
    draftingCount,
    readyCount,
    appliedCount,
    interviewCount,
    offerCount,
    closedCount,
  ] = await Promise.all([
    JobModel.countDocuments({
      ...base,
      status: "New",
      reviewStatus: { $nin: ["rejected", "saved", "apply_next"] },
    }),
    JobModel.countDocuments({
      ...base,
      $or: [{ reviewStatus: "saved" }, { status: "Saved" }, { pipelineStage: "Saved" }],
    }),
    JobModel.countDocuments({
      ...base,
      $or: [{ status: { $in: ["Research", "Drafting"] } }, { pipelineStage: "Drafting" }],
    }),
    JobModel.countDocuments({
      ...base,
      $or: [
        { status: { $in: ["Ready to Apply", "Applying", "External Apply Required"] } },
        { pipelineStage: "Ready" },
      ],
    }),
    JobModel.countDocuments({
      ...base,
      $or: [{ status: "Applied" }, { pipelineStage: "Applied" }],
    }),
    JobModel.countDocuments({
      ...base,
      $or: [{ status: "Interview" }, { pipelineStage: "Interview" }],
    }),
    JobModel.countDocuments({
      ...base,
      $or: [{ status: "Offer" }, { pipelineStage: "Offer" }],
    }),
    JobModel.countDocuments({
      ...base,
      $or: [
        { status: { $in: ["Rejected", "Archived"] } },
        { reviewStatus: "rejected" },
        { pipelineStage: "Closed" },
      ],
    }),
  ]);

  return {
    New: newCount,
    Saved: savedCount,
    Drafting: draftingCount,
    Ready: readyCount,
    Applied: appliedCount,
    Interview: interviewCount,
    Offer: offerCount,
    Closed: closedCount,
  };
}

export function pipelineCountsToSummary(counts: Record<JobPipelineStage, number>) {
  const pipeline = jobPipelineStages.map((stage) => ({
    status: stage,
    count: counts[stage] ?? 0,
  }));
  const totalActive = pipeline.reduce((sum, row) => sum + row.count, 0);
  return { pipeline, totalActive };
}

export async function countFollowUpsDue(tenantId: string): Promise<number> {
  const now = new Date();
  return ApplicationModel.countDocuments({
    tenantId,
    applicationStatus: { $in: ["Applied", "Follow-Up Due", "Replied"] },
    followUpDate: { $lte: now },
    followUpStatus: { $in: ["Due Today", "Overdue", "Scheduled"] },
  });
}

export async function countUpcomingInterviews(tenantId: string, withinDays = 7): Promise<number> {
  const now = new Date();
  const end = new Date(now.getTime() + withinDays * 86400000);
  return InterviewModel.countDocuments({
    tenantId,
    status: { $in: ["Scheduled", "Awaiting Confirmation"] },
    dateTime: { $gte: now, $lte: end },
  });
}

const workspaceJobFilter = {
  $or: [{ jobId: { $exists: false } }, { jobId: null }, { jobId: "" }],
};

async function hasDriveLinkedProfileDoc(
  tenantId: string,
  userId: string,
  profileDocumentType: "cv_resume" | "cover_letter_template"
): Promise<boolean> {
  const driveMeta = {
    $or: [
      { googleDriveFileId: { $exists: true, $nin: [null, ""] } },
      { driveFileId: { $exists: true, $nin: [null, ""] } },
      { driveFileLink: { $exists: true, $nin: [null, ""] } },
    ],
  };
  const base = {
    tenantId,
    profileDocumentType,
    isActiveProfileDocument: true,
    $and: [workspaceJobFilter, driveMeta],
  };
  if (await DocumentModel.exists(base)) return true;
  return Boolean(await DocumentModel.exists({ ...base, createdBy: userId }));
}

export async function hasActiveCvMetadata(tenantId: string, userId: string): Promise<boolean> {
  return hasDriveLinkedProfileDoc(tenantId, userId, "cv_resume");
}

export async function hasActiveCoverLetterTemplateMetadata(tenantId: string, userId: string): Promise<boolean> {
  return hasDriveLinkedProfileDoc(tenantId, userId, "cover_letter_template");
}
