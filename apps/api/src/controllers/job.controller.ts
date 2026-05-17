import { DocumentModel, JobModel } from "@jobflow/database/models";
import type { Request } from "express";
import { callAnthropicMessages, buildAnthropicModelCandidates, resolveAnthropicApiKey } from "@jobflow/integrations/ai/anthropic-messages";
import { asyncHandler } from "../utils/asyncHandler";
import { paginatedResponse, successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { listAutomationLogs, logApiAction } from "../services/automation-log.service";
import { assertTenantId, buildTenantFilter, createTenantScopedRecord, findTenantScopedById, updateTenantScopedById, archiveTenantScopedById } from "../services/baseTenant.service";
import { getPagination } from "../utils/pagination";
import { checkDuplicateJob as checkDuplicateAgainstExisting } from "../services/duplicate-protection.service";
import { getAiProcessingStatus as getAiStatusForJob, runDraftGeneration, runFullAiProcessing, runResearchGeneration } from "../services/ai-processing.service";
import { provisionJobFolders } from "../services/folder-automation.service";
import { enqueueAutomationModule } from "../services/automation-queue.service";
import { getProfileDocumentContextFlags } from "../services/profile-document-context.service";
import { assertCanCreateJob } from "../services/plan-limit.service";
import { incrementUsage } from "../services/usage.service";
/** Conditions that identify demo/test/stub jobs that must never appear in production. */
function buildTestJobFilter(): Record<string, unknown> {
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

const PIPELINE_STATUSES = ["New", "Research", "Drafting", "Ready to Apply", "Applied", "Applying", "Interview", "Offer", "Rejected"];

export const getPipelineSummary = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const filter: Record<string, unknown> = { ...buildTenantFilter(tenantId), status: { $nin: ["Archived"] } };
  filter.$nor = [buildTestJobFilter()];

  const agg = await JobModel.aggregate([
    { $match: filter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of agg) byStatus[String(row._id)] = Number(row.count);

  const pipeline = PIPELINE_STATUSES.map((status) => ({ status, count: byStatus[status] ?? 0 }));
  const totalActive = pipeline.reduce((sum, d) => sum + d.count, 0);

  return successResponse(res, { pipeline, totalActive });
});

export const listJobs = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const { page, limit, skip } = getPagination(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const priority = typeof req.query.priority === "string" ? req.query.priority : undefined;
  const source = typeof req.query.source === "string" ? req.query.source : undefined;
  const includeArchived = req.query.includeArchived === "true";
  const includeTest = req.query.includeTest === "true" && req.user?.role === "Owner";

  const filter: Record<string, unknown> = buildTenantFilter(tenantId);

  if (status) {
    filter.status = status;
  } else if (!includeArchived) {
    filter.status = { $nin: ["Rejected", "Archived"] };
  }

  // Exclude demo/test/stub jobs unless caller is an Owner explicitly opting in
  if (!includeTest) {
    filter.$nor = [buildTestJobFilter()];
  }

  if (priority) filter.priority = priority;
  if (source) filter.source = source;
  if (search) filter.$or = [{ company: { $regex: search, $options: "i" } }, { position: { $regex: search, $options: "i" } }, { source: { $regex: search, $options: "i" } }, { contactEmail: { $regex: search, $options: "i" } }];

  const [rows, total] = await Promise.all([
    JobModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    JobModel.countDocuments(filter),
  ]);
  return paginatedResponse(res, rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
});
export const createJob = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); await assertCanCreateJob(tenantId); const row=await createTenantScopedRecord(JobModel,tenantId,req.user?.id??'system',req.body); await incrementUsage({ tenantId, metric: "jobsCount", amount: 1 }); return successResponse(res,row,'Created',201); });
export const getJobById = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const row = await findTenantScopedById(JobModel, tenantId, req.params.id);
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  const jobId = req.params.id;
  const userId = req.user?.id ?? "system";
  const [documents, automationLogs, profileDocumentContext] = await Promise.all([
    DocumentModel.find({ tenantId, jobId }).sort({ createdAt: -1 }).limit(50).lean(),
    listAutomationLogs(tenantId, { jobId, limit: 20 }),
    getProfileDocumentContextFlags(tenantId, userId),
  ]);
  const base = typeof (row as { toObject?: () => Record<string, unknown> }).toObject === "function"
    ? (row as { toObject: () => Record<string, unknown> }).toObject()
    : (row as Record<string, unknown>);
  return successResponse(res, { ...base, documents, automationLogs, profileDocumentContext });
});
export const updateJob = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const row=await updateTenantScopedById(JobModel,tenantId,req.params.id,req.body); if(!row) throw new ApiError('Not found',404,'NOT_FOUND'); return successResponse(res,row,'Updated'); });
export const archiveJob = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const row=await archiveTenantScopedById(JobModel,tenantId,req.params.id,{status:'Archived'} as never); if(!row) throw new ApiError('Not found',404,'NOT_FOUND'); return successResponse(res,row,'Archived'); });
export const checkDuplicateJob = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const job = await findTenantScopedById(JobModel, tenantId, req.params.id);
  if (!job) throw new ApiError("Not found", 404, "NOT_FOUND");

  const duplicateCheck = await checkDuplicateAgainstExisting(tenantId, {
    company: job.company,
    position: job.position,
    location: job.location,
    jobUrl: job.jobUrl,
    salaryRange: job.salaryRange,
    deadline: job.deadline?.toISOString(),
    contactEmail: job.contactEmail,
    description: job.description,
    source: job.source ?? "manual",
    confidence: 1,
    tags: job.tags,
    raw: { fromJobId: String(job._id) },
  });

  const isSelfMatch = duplicateCheck.duplicateOfJobId === String(job._id);
  const normalizedResult = isSelfMatch
    ? {
        ...duplicateCheck,
        status: "Skipped" as const,
        duplicateOfJobId: undefined,
        reasons: [...duplicateCheck.reasons, "Self match ignored"],
      }
    : duplicateCheck;

  await JobModel.findByIdAndUpdate(job._id, {
    duplicateStatus: normalizedResult.status,
    duplicateScore: normalizedResult.duplicateScore,
    duplicateOfJobId: normalizedResult.duplicateOfJobId,
  });

  await logApiAction({
    tenantId,
    moduleKey: "duplicate-protection",
    status: "Success",
    message: "Duplicate check completed",
    relatedRecordType: "Job",
    relatedRecordId: req.params.id,
    metadata: { duplicateCheck: normalizedResult },
  });

  return successResponse(res, normalizedResult, "Duplicate check completed");
});
export const generateResearch = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const jobId=req.params.id; const userId=req.user?.id ?? "system"; const execute=req.query.execute==="true"; if(execute){ if(process.env.NODE_ENV==="production") throw new ApiError("Direct execute=true is disabled in production",403,"FORBIDDEN"); const result=await runResearchGeneration({ tenantId, jobId, userId }); return successResponse(res,result,'Research generation completed'); } const queued = await enqueueAutomationModule({ tenantId, userId, moduleKey:"research-document", payload:{ jobId, mode:"research" }, source:"api" }); return successResponse(res,{operationId:queued.operationId,jobId:queued.jobId,moduleKey:"research-document",status:queued.status,message:queued.message},'Research generation queued'); });
export const generateDraft = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const jobId=req.params.id; const userId=req.user?.id ?? "system"; const execute=req.query.execute==="true"; if(execute){ if(process.env.NODE_ENV==="production") throw new ApiError("Direct execute=true is disabled in production",403,"FORBIDDEN"); const result=await runDraftGeneration({ tenantId, jobId, userId }); return successResponse(res,result,'Draft generation completed'); } const queued = await enqueueAutomationModule({ tenantId, userId, moduleKey:"ai-processing", payload:{ jobId, mode:"draft" }, source:"api" }); return successResponse(res,{operationId:queued.operationId,jobId:queued.jobId,moduleKey:"ai-processing",status:queued.status,message:queued.message},'Draft generation queued'); });
export const runAiProcessing = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const mode=req.body.mode as "research"|"draft"|"full"; const jobId=(req.params.id || req.body.jobId) as string; if(!jobId) throw new ApiError("Job id is required",422,"VALIDATION_ERROR"); const userId=req.user?.id ?? "system"; const execute=req.query.execute==="true"; if(execute){ if(process.env.NODE_ENV==="production") throw new ApiError("Direct execute=true is disabled in production",403,"FORBIDDEN"); const result = mode==="research" ? await runResearchGeneration({tenantId,jobId,userId}) : mode==="draft" ? await runDraftGeneration({tenantId,jobId,userId}) : await runFullAiProcessing({tenantId,jobId,userId}); return successResponse(res,result,"AI processing completed"); } const queued=await enqueueAutomationModule({ tenantId, userId, moduleKey:"ai-processing", payload:{ jobId, mode }, source:"api" }); return successResponse(res,{operationId:queued.operationId,jobId:queued.jobId,moduleKey:"ai-processing",status:queued.status,message:queued.message},"AI processing queued"); });
export const aiProcessingStatus = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const result=await getAiStatusForJob(tenantId,req.params.id); return successResponse(res,result); });
export const provisionFolders = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const jobId=req.params.id; const userId=req.user?.id ?? "system"; const execute=req.query.execute==="true"; if(execute){ if(process.env.NODE_ENV==="production") throw new ApiError("Direct execute=true is disabled in production",403,"FORBIDDEN"); const result=await provisionJobFolders({ tenantId, jobId, userId }); return successResponse(res,result,"Job folders provisioned"); } const queued=await enqueueAutomationModule({ tenantId, userId, moduleKey:"folder-automation", payload:{ jobId }, source:"api" }); return successResponse(res,{operationId:queued.operationId,jobId:queued.jobId,moduleKey:"folder-automation",status:queued.status,message:queued.message},"Job folder provisioning queued"); });

// ── Quick Review endpoints ────────────────────────────────────────────────────

const REVIEW_STATUSES = ["new", "rejected", "review_later", "saved", "apply_next"] as const;
type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const getReviewQueue = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const filter = {
    ...buildTenantFilter(tenantId),
    status: { $nin: ["Rejected", "Archived"] },
    $or: [{ reviewStatus: "new" }, { reviewStatus: { $exists: false } }, { reviewStatus: null }],
    $nor: [{ source: "test" }, { intakeSource: "test" }],
  };
  const [jobs, total] = await Promise.all([
    JobModel.find(filter).sort({ priority: -1, dateFound: -1, createdAt: -1 }).limit(limit).lean(),
    JobModel.countDocuments(filter),
  ]);
  const urgentCount = (jobs as any[]).filter((j) => j.priority === "Urgent" || j.priority === "High").length;
  const deadlineSoonCount = (jobs as any[]).filter((j) => {
    if (!j.deadline) return false;
    const daysUntil = (new Date(j.deadline).getTime() - Date.now()) / 86400000;
    return daysUntil >= 0 && daysUntil <= 7;
  }).length;
  return successResponse(res, { jobs, total, urgentCount, deadlineSoonCount });
});

export const reviewJob = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const jobId = req.params.id;
  const userId = req.user?.id ?? "system";
  const { reviewAction, reviewStatus } = req.body as { reviewAction: string; reviewStatus: ReviewStatus };
  if (!reviewStatus || !REVIEW_STATUSES.includes(reviewStatus)) {
    throw new ApiError("Invalid reviewStatus", 422, "VALIDATION_ERROR");
  }
  const job = await findTenantScopedById(JobModel, tenantId, jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");
  const previousReviewStatus = (job as any).reviewStatus ?? "new";
  await JobModel.findByIdAndUpdate(job._id, {
    reviewStatus,
    reviewedAt: new Date(),
    reviewedBy: userId,
    reviewAction: reviewAction ?? reviewStatus,
    previousReviewStatus,
  });
  return successResponse(res, {
    jobId,
    reviewStatus,
    reviewAction: reviewAction ?? reviewStatus,
    previousReviewStatus,
    reviewedAt: new Date().toISOString(),
  });
});

export const undoReview = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const jobId = req.params.id;
  const job = await findTenantScopedById(JobModel, tenantId, jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");
  const previousStatus = ((job as any).previousReviewStatus ?? "new") as ReviewStatus;
  await JobModel.findByIdAndUpdate(job._id, {
    reviewStatus: previousStatus,
    reviewedAt: null,
    reviewedBy: null,
    reviewAction: null,
    previousReviewStatus: null,
  });
  return successResponse(res, { jobId, reviewStatus: previousStatus, undone: true });
});

export const analyzeJobForReview = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const jobId = req.params.id;
  const job = await findTenantScopedById(JobModel, tenantId, jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");
  const j = job as any;

  // Return cached result if fresh (< 24h)
  if (j.reviewAiScore != null && j.reviewAiGeneratedAt) {
    const ageMs = Date.now() - new Date(j.reviewAiGeneratedAt).getTime();
    if (ageMs < 24 * 60 * 60 * 1000) {
      return successResponse(res, {
        score: j.reviewAiScore,
        reasons: j.reviewAiReasons ?? [],
        redFlags: j.reviewAiRedFlags ?? [],
        effort: j.reviewAiEffort ?? "Medium",
        recommendation: j.reviewAiRecommendation ?? "Review manually",
        cached: true,
      });
    }
  }

  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) {
    return successResponse(res, { score: null, reasons: [], redFlags: [], effort: "Medium", recommendation: "AI not configured", cached: false });
  }

  const desc = j.description?.slice(0, 3000) ?? "";
  const salary = j.salaryRange ? `Salary: ${j.salaryRange}.` : "Salary not listed.";
  const location = j.location ? `Location: ${j.location}.` : "";
  const deadline = j.deadline ? `Application deadline: ${new Date(j.deadline).toLocaleDateString()}.` : "";

  const prompt = `You are a career advisor evaluating a job posting. Analyze the following job and respond ONLY with valid JSON.

Job: ${j.position} at ${j.company}
${location} ${salary} ${deadline}
Source: ${j.source ?? "Unknown"}

Description:
${desc || "No description provided."}

Respond with exactly this JSON shape:
{
  "score": <integer 0-100, overall attractiveness of this opportunity>,
  "reasons": [<string>, <string>, <string>],
  "redFlags": [<string>, <string>],
  "effort": "<Low|Medium|High>",
  "recommendation": "<one short sentence: Apply now | Save for later | Skip | Needs review>"
}

score: Rate the overall quality/attractiveness of this job posting (clarity, salary transparency, role clarity, company reputation indicators).
reasons: 3 short bullet points on why this could be a good opportunity.
redFlags: 1-2 short concerns (missing salary, vague role, excessive requirements, etc.). Empty array if none.
effort: Estimate application effort based on description complexity and requirements.
recommendation: Concise recommended action.`;

  try {
    const modelCandidates = buildAnthropicModelCandidates();
    const result = await callAnthropicMessages({ prompt, apiKey, modelCandidates, maxTokens: 400, temperature: 0.2 });
    if (!result.ok) throw new Error(result.message ?? "AI call failed");
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    const parsed = JSON.parse(jsonMatch[0]) as { score: number; reasons: string[]; redFlags: string[]; effort: string; recommendation: string };
    await JobModel.findByIdAndUpdate(job._id, {
      reviewAiScore: parsed.score,
      reviewAiReasons: parsed.reasons ?? [],
      reviewAiRedFlags: parsed.redFlags ?? [],
      reviewAiEffort: parsed.effort,
      reviewAiRecommendation: parsed.recommendation,
      reviewAiGeneratedAt: new Date(),
    });
    return successResponse(res, { ...parsed, cached: false });
  } catch {
    return successResponse(res, { score: null, reasons: [], redFlags: [], effort: "Medium", recommendation: "Analysis unavailable", cached: false });
  }
});

export const applyToJob = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const { id } = req.params as { id: string };
  const userId = req.user?.id ?? "system";

  const job = await findTenantScopedById(JobModel, tenantId, id);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const j = job as Record<string, unknown>;
  const jobUrl = String(j.jobUrl ?? j.url ?? "");
  if (!jobUrl) throw new ApiError("This job has no URL — cannot auto-apply.", 422, "VALIDATION_ERROR");

  const result = await enqueueAutomationModule({
    moduleKey: "job-apply",
    tenantId,
    userId,
    payload: {
      jobId: id,
      jobUrl,
      coverLetterUrl: String(j.generatedCoverLetterLink ?? ""),
    },
    source: "api",
  });

  return successResponse(res, {
    status: result.status,
    operationId: result.operationId,
    message: result.message,
  });
});
