import { DocumentModel, JobModel } from "@jobflow/database/models";
import type { Request, Response } from "express";
import { callAnthropicMessages, buildAnthropicModelCandidates, resolveAnthropicApiKey } from "@jobflow/integrations/ai/anthropic-messages";
import { asyncHandler } from "../utils/asyncHandler";
import { paginatedResponse, successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { listAutomationLogs, logApiAction } from "../services/automation-log.service";
import { assertTenantId, buildTenantFilter, createTenantScopedRecord, findTenantScopedById, updateTenantScopedById, archiveTenantScopedById } from "../services/baseTenant.service";
import { checkDuplicateJob as checkDuplicateAgainstExisting } from "../services/duplicate-protection.service";
import { getAiProcessingStatus as getAiStatusForJob, runDraftGeneration, runFullAiProcessing, runResearchGeneration } from "../services/ai-processing.service";
import { provisionJobFolders } from "../services/folder-automation.service";
import { enqueueAutomationModule } from "../services/automation-queue.service";
import { setJobPipelineStage, syncJobPipelineFromApplication } from "../services/job-pipeline.service";
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

import { getPipelineCounts, pipelineCountsToSummary } from "../services/job-pipeline.service";

export const getPipelineSummary = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const counts = await getPipelineCounts(tenantId);
  const { pipeline, totalActive } = pipelineCountsToSummary(counts);
  return successResponse(res, { pipeline, totalActive });
});

export const listJobs = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  /** Jobs list allows a higher page size than generic list endpoints (dashboard needs full pipeline tabs). */
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 20)));
  const skip = (page - 1) * limit;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const priority = typeof req.query.priority === "string" ? req.query.priority : undefined;
  const source = typeof req.query.source === "string" ? req.query.source : undefined;
  const includeArchived = req.query.includeArchived === "true";
  const includeTest = req.query.includeTest === "true" && req.user?.role === "Owner";

  const filter: Record<string, unknown> = buildTenantFilter(tenantId);

  if (status) {
    const parts = status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      filter.status = { $in: parts };
    } else {
      filter.status = parts[0] ?? status;
    }
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
export const generateDraft = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const jobId=req.params.id; const userId=req.user?.id ?? "system"; const execute=req.query.execute==="true"; const userInstructions=typeof req.body?.customPrompt==="string"&&req.body.customPrompt.trim()?req.body.customPrompt.trim():undefined; if(execute){ if(process.env.NODE_ENV==="production") throw new ApiError("Direct execute=true is disabled in production",403,"FORBIDDEN"); const result=await runDraftGeneration({ tenantId, jobId, userId, userInstructions }); return successResponse(res,result,'Draft generation completed'); } const queued = await enqueueAutomationModule({ tenantId, userId, moduleKey:"ai-processing", payload:{ jobId, mode:"draft", userInstructions }, source:"api" }); return successResponse(res,{operationId:queued.operationId,jobId:queued.jobId,moduleKey:"ai-processing",status:queued.status,message:queued.message},'Draft generation queued'); });
export const runAiProcessing = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const mode=req.body.mode as "research"|"draft"|"full"; const jobId=(req.params.id || req.body.jobId) as string; if(!jobId) throw new ApiError("Job id is required",422,"VALIDATION_ERROR"); const userId=req.user?.id ?? "system"; const execute=req.query.execute==="true"; if(execute){ if(process.env.NODE_ENV==="production") throw new ApiError("Direct execute=true is disabled in production",403,"FORBIDDEN"); const result = mode==="research" ? await runResearchGeneration({tenantId,jobId,userId}) : mode==="draft" ? await runDraftGeneration({tenantId,jobId,userId}) : await runFullAiProcessing({tenantId,jobId,userId}); return successResponse(res,result,"AI processing completed"); } const queued=await enqueueAutomationModule({ tenantId, userId, moduleKey:"ai-processing", payload:{ jobId, mode }, source:"api" }); return successResponse(res,{operationId:queued.operationId,jobId:queued.jobId,moduleKey:"ai-processing",status:queued.status,message:queued.message},"AI processing queued"); });
export const aiProcessingStatus = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const result=await getAiStatusForJob(tenantId,req.params.id); return successResponse(res,result); });
export const provisionFolders = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const jobId=req.params.id; const userId=req.user?.id ?? "system"; const execute=req.query.execute==="true"; if(execute){ if(process.env.NODE_ENV==="production") throw new ApiError("Direct execute=true is disabled in production",403,"FORBIDDEN"); const result=await provisionJobFolders({ tenantId, jobId, userId }); return successResponse(res,result,"Job folders provisioned"); } const queued=await enqueueAutomationModule({ tenantId, userId, moduleKey:"folder-automation", payload:{ jobId }, source:"api" }); return successResponse(res,{operationId:queued.operationId,jobId:queued.jobId,moduleKey:"folder-automation",status:queued.status,message:queued.message},"Job folder provisioning queued"); });

// ── Quick Review endpoints ────────────────────────────────────────────────────

const REVIEW_STATUSES = ["new", "rejected", "review_later", "saved", "apply_next"] as const;
type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const getReviewQueue = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  /**
   * Pipeline “New” jobs that are not finished in Quick Review.
   * Use $nin (not $or on only "new") so we still include review_later, unknown values,
   * and legacy casing — the old $or excluded review_later and anything outside the list,
   * which produced an empty queue while the dashboard still showed many status New jobs.
   */
  const filter: Record<string, unknown> = {
    ...buildTenantFilter(tenantId),
    status: "New",
    reviewStatus: { $nin: ["rejected", "saved", "apply_next"] },
    $nor: [buildTestJobFilter()],
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
  if (reviewStatus === "saved") {
    await setJobPipelineStage({ tenantId, jobId, pipelineStage: "Saved", userId });
  } else if (reviewStatus === "rejected") {
    await setJobPipelineStage({ tenantId, jobId, pipelineStage: "Closed", userId });
  } else if (reviewStatus === "apply_next") {
    await setJobPipelineStage({ tenantId, jobId, pipelineStage: "Ready", userId, skipIfApplicationExists: true });
  }
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

/** Tenant-scoped query: latest CV document that has pasted or extracted text. */
function buildActiveCvDocumentFilter(tenantId: string): Record<string, unknown> {
  return {
    tenantId,
    $and: [
      { $or: [{ type: "CV" }, { type: "cv_resume" }, { profileDocumentType: "cv_resume" }] },
      {
        $or: [
          { contentText: { $exists: true, $nin: [null, ""] } },
          { content: { $exists: true, $nin: [null, ""] } },
        ],
      },
    ],
  };
}

function pickNonEmptyString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function stringArrayField(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => String(x)).filter((s) => s.trim());
}

/** Normalize bullets whether the model returned `experience`, `tailoredBullets`, or `bullets`. */
function normalizeTailoredBullets(cvParsed: Record<string, unknown>): Array<{ role: string; bullets: string[] }> {
  const raw =
    (Array.isArray(cvParsed.experience) && cvParsed.experience) ||
    (Array.isArray(cvParsed.tailoredBullets) && cvParsed.tailoredBullets) ||
    (Array.isArray(cvParsed.bullets) && cvParsed.bullets) ||
    [];
  const out: Array<{ role: string; bullets: string[] }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const role =
      pickNonEmptyString(row.role, row.title, row.position, row.jobTitle) || "Experience";
    const bl = row.bullets;
    const bullets = Array.isArray(bl) ? bl.map((b) => String(b)).filter((b) => b.trim()) : [];
    if (bullets.length > 0) out.push({ role, bullets });
  }
  return out;
}

function coverLetterBodyFromParsed(o: Record<string, unknown>): string {
  return pickNonEmptyString(o.body, o.cover_letter, o.coverLetter, o.letter, o.text);
}

function coverLetterSubjectFromParsed(o: Record<string, unknown>, position: string): string {
  return pickNonEmptyString(o.subject, o.email_subject, o.title) || `Application for ${position}`;
}

export const getTailoredCv = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const job = await findTenantScopedById(JobModel, tenantId, req.params.id);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");
  const j = job as Record<string, unknown>;
  if (!j.tailoredCvStatus) {
    return successResponse(res, {
      status: "Not Started",
      headline: null,
      summary: null,
      keywords: [],
      missingKeywords: [],
      bullets: [],
      atsScoreBefore: null,
      atsScoreAfter: null,
      generatedAt: null,
      coverLetter: null,
      coverLetterSubject: null,
      error: null,
    });
  }
  return successResponse(res, {
    status:            j.tailoredCvStatus,
    headline:          j.tailoredCvHeadline,
    summary:           j.tailoredCvSummary,
    keywords:          j.tailoredCvKeywords ?? [],
    missingKeywords:   j.tailoredCvMissingKeywords ?? [],
    bullets:           j.tailoredCvBullets ?? [],
    atsScoreBefore:    j.tailoredCvAtsScoreBefore,
    atsScoreAfter:     j.tailoredCvAtsScoreAfter,
    generatedAt:       j.tailoredCvGeneratedAt,
    coverLetter:       j.tailoredCoverLetter,
    coverLetterSubject: j.tailoredCoverLetterSubject,
    error:             j.tailoredCvError,
  });
});

export const generateTailoredCv = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const job = await findTenantScopedById(JobModel, tenantId, req.params.id);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");
  const j = job as Record<string, unknown>;

  // POST always runs a fresh generation (GET returns stored data). A 7-day cache here caused
  // "Regenerate" to return stale or empty payloads without calling the model again.

  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) throw new ApiError("AI not configured", 503, "SERVICE_UNAVAILABLE");

  const body = (req.body ?? {}) as Record<string, unknown>;
  const userInstructions =
    typeof body.userInstructions === "string" && body.userInstructions.trim()
      ? body.userInstructions.trim()
      : "";
  const instructionsBlock = userInstructions
    ? `\n\nExtra instructions from the candidate:\n${userInstructions}`
    : "";

  const cvDoc = await DocumentModel.findOne(buildActiveCvDocumentFilter(tenantId))
    .sort({ updatedAt: -1 })
    .lean() as Record<string, unknown> | null;

  const cvText = cvDoc ? String(cvDoc.contentText ?? (cvDoc as { content?: string }).content ?? "") : "";
  if (!cvText.trim()) {
    throw new ApiError(
      "No CV with text found. Upload a CV under Documents and paste or extract the text.",
      422,
      "NO_CV_TEXT"
    );
  }

  const jobDesc = String(j.description ?? j.aiSummary ?? "").slice(0, 3000);
  const position = String(j.position ?? j.title ?? "");
  const company = String(j.company ?? "");

  const modelCandidates = buildAnthropicModelCandidates();

  const cvPrompt = `You are an ATS-optimisation specialist. Given a job description and a candidate's CV, output ONLY valid JSON with no markdown fences.

Job: ${position} at ${company}
Description: ${jobDesc}

CV:
${cvText.slice(0, 4000)}
${instructionsBlock}

Output exactly this JSON (no extra text, no markdown):
{
  "headline": "<ATS-optimised headline for this role, max 12 words>",
  "summary": "<3-4 sentence professional summary tailored to this role>",
  "keywords": ["<keyword>", ...],
  "missingKeywords": ["<missing skill from JD not in CV>", ...],
  "experience": [
    {
      "role": "<job title from CV>",
      "company": "<company name from CV>",
      "period": "<date range e.g. Jan 2022 – Mar 2024>",
      "bullets": ["<rewritten achievement bullet with metrics>", "<another bullet>"]
    }
  ],
  "atsScoreBefore": <integer 0-100>,
  "atsScoreAfter": <integer 0-100>
}`;

  const coverPrompt = `Write a professional cover letter for ${position} at ${company}.

Job description: ${jobDesc}

CV summary: ${cvText.slice(0, 2000)}
${instructionsBlock}

Output ONLY valid JSON:
{"subject": "<email subject line>", "body": "<full cover letter, 3-4 paragraphs, professional tone>"}`;

  const [cvResult, clResult] = await Promise.all([
    callAnthropicMessages({ prompt: cvPrompt, apiKey, modelCandidates, maxTokens: 1200, temperature: 0.3 }),
    callAnthropicMessages({ prompt: coverPrompt, apiKey, modelCandidates, maxTokens: 800, temperature: 0.4 }),
  ]);

  const markFailed = async (message: string) => {
    await JobModel.findByIdAndUpdate(job._id, {
      $set: { tailoredCvStatus: "Failed", tailoredCvError: message },
    });
  };

  if (!cvResult.ok) {
    await markFailed(cvResult.message);
    throw new ApiError(cvResult.message, 502, "AI_FAILED");
  }

  let cvParsed: Record<string, unknown> = {};
  try {
    const m = cvResult.text.match(/\{[\s\S]*\}/);
    if (m) cvParsed = JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    cvParsed = {};
  }

  let clParsed: Record<string, unknown> = {};
  try {
    if (clResult.ok) {
      const m = clResult.text.match(/\{[\s\S]*\}/);
      if (m) clParsed = JSON.parse(m[0]) as Record<string, unknown>;
    }
  } catch {
    clParsed = {};
  }

  const headline = pickNonEmptyString(
    cvParsed.headline,
    cvParsed.tailoredHeadline,
    cvParsed.cv_headline
  );
  const summary = pickNonEmptyString(cvParsed.summary, cvParsed.tailoredSummary, cvParsed.professional_summary);
  const keywords = stringArrayField(cvParsed.keywords ?? cvParsed.atsKeywords ?? cvParsed.matchedKeywords);
  const missingKeywords = stringArrayField(cvParsed.missingKeywords ?? cvParsed.missing_keywords);
  const tailoredBullets = normalizeTailoredBullets(cvParsed);
  const atsBefore = Number(cvParsed.atsScoreBefore ?? cvParsed.scoreBefore ?? 0) || 0;
  const atsAfter = Number(cvParsed.atsScoreAfter ?? cvParsed.scoreAfter ?? 0) || 0;

  const hasCvBody =
    Boolean(headline) || Boolean(summary) || tailoredBullets.length > 0;

  if (!hasCvBody) {
    const msg =
      "AI returned no usable CV fields. Try again, add a clearer job description, or check your CV text in Documents.";
    await markFailed(msg);
    throw new ApiError(msg, 502, "AI_EMPTY");
  }

  let coverBody = coverLetterBodyFromParsed(clParsed);
  if (!coverBody && clResult.ok) {
    const raw = clResult.text.trim();
    if (raw && !raw.startsWith("{")) coverBody = raw;
  }
  const coverSubject = coverLetterSubjectFromParsed(clParsed, position);

  const update = {
    tailoredCvStatus: "Completed" as const,
    tailoredCvHeadline: headline,
    tailoredCvSummary: summary,
    tailoredCvKeywords: keywords,
    tailoredCvMissingKeywords: missingKeywords,
    tailoredCvBullets: tailoredBullets,
    tailoredCvAtsScoreBefore: atsBefore,
    tailoredCvAtsScoreAfter: atsAfter,
    tailoredCvGeneratedAt: new Date(),
    tailoredCoverLetter: coverBody,
    tailoredCoverLetterSubject: coverSubject,
    tailoredCvError: null,
  };

  await JobModel.findByIdAndUpdate(job._id, { $set: update });

  return successResponse(res, {
    status: "Completed" as const,
    cached: false,
    headline: update.tailoredCvHeadline,
    summary: update.tailoredCvSummary,
    keywords: update.tailoredCvKeywords,
    missingKeywords: update.tailoredCvMissingKeywords,
    bullets: update.tailoredCvBullets,
    atsScoreBefore: update.tailoredCvAtsScoreBefore,
    atsScoreAfter: update.tailoredCvAtsScoreAfter,
    generatedAt: update.tailoredCvGeneratedAt,
    coverLetter: update.tailoredCoverLetter,
    coverLetterSubject: update.tailoredCoverLetterSubject,
    error: null,
  });
});

export const generateCvPdf = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const job = await findTenantScopedById(JobModel, tenantId, req.params.id);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");
  const j = job as Record<string, unknown>;

  const body = req.body as Record<string, unknown>;
  const templateId = String(body.templateId ?? "modern-no-photo");
  const personalInfo = (body.personalInfo ?? {}) as Record<string, string>;

  const cvDoc = await DocumentModel.findOne(buildActiveCvDocumentFilter(tenantId))
    .sort({ updatedAt: -1 })
    .lean() as Record<string, unknown> | null;

  // Build template data from job tailored fields + personal info
  const templateData = {
    name: String(personalInfo.name ?? ""),
    headline: String(j.tailoredCvHeadline ?? personalInfo.headline ?? ""),
    email: String(personalInfo.email ?? ""),
    phone: String(personalInfo.phone ?? ""),
    location: String(personalInfo.location ?? ""),
    linkedin: String(personalInfo.linkedin ?? ""),
    summary: String(j.tailoredCvSummary ?? ""),
    bullets: Array.isArray(j.tailoredCvBullets) ? (j.tailoredCvBullets as string[]) : [],
    keywords: Array.isArray(j.tailoredCvKeywords) ? (j.tailoredCvKeywords as string[]) : [],
    cvText: cvDoc ? String(cvDoc.contentText ?? (cvDoc as { content?: string }).content ?? "") : "",
    photoUrl: String(personalInfo.photoUrl ?? ""),
    templateId,
  };

  // Dynamically load PDF renderer (only available in Next.js web app)
  // In Railway API, return structured data for client-side rendering
  return successResponse(res, { templateData, message: "Use /api/jobs/:id/cv-pdf on the web app for PDF generation" });
});

export const generateCoverLetterPdf = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const job = await findTenantScopedById(JobModel, tenantId, req.params.id);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");
  const j = job as Record<string, unknown>;
  return successResponse(res, {
    subject: j.tailoredCoverLetterSubject ?? "",
    body: j.tailoredCoverLetter ?? "",
    message: "Use /api/jobs/:id/cover-letter-pdf on the web app for PDF generation",
  });
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
