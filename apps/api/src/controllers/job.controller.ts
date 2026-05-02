import { JobModel } from "@database/models";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paginatedResponse, successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { logApiAction } from "../services/automation-log.service";
import { assertTenantId, buildTenantFilter, createTenantScopedRecord, findTenantScopedById, updateTenantScopedById, archiveTenantScopedById } from "../services/baseTenant.service";
import { getPagination } from "../utils/pagination";
import { checkDuplicateJob as checkDuplicateAgainstExisting } from "../services/duplicate-protection.service";
import { getAiProcessingStatus as getAiStatusForJob, runDraftGeneration, runFullAiProcessing, runResearchGeneration } from "../services/ai-processing.service";
import { provisionJobFolders } from "../services/folder-automation.service";
import { enqueueAutomationModule } from "../services/automation-queue.service";
import { assertCanCreateJob } from "../services/plan-limit.service";
import { incrementUsage } from "../services/usage.service";
export const listJobs = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const {page,limit,skip}=getPagination(req.query); const search=typeof req.query.search==='string'?req.query.search:undefined; const status=typeof req.query.status==='string'?req.query.status:undefined; const priority=typeof req.query.priority==='string'?req.query.priority:undefined; const source=typeof req.query.source==='string'?req.query.source:undefined; const filter:Record<string,unknown>=buildTenantFilter(tenantId); if(status) filter.status=status; if(priority) filter.priority=priority; if(source) filter.source=source; if(search) filter.$or=[{company:{$regex:search,$options:'i'}},{position:{$regex:search,$options:'i'}},{source:{$regex:search,$options:'i'}},{contactEmail:{$regex:search,$options:'i'}}]; const [rows,total]=await Promise.all([JobModel.find(filter).sort({updatedAt:-1}).skip(skip).limit(limit),JobModel.countDocuments(filter)]); return paginatedResponse(res,rows,{page,limit,total,totalPages:Math.ceil(total/limit)}); });
export const createJob = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); await assertCanCreateJob(tenantId); const row=await createTenantScopedRecord(JobModel,tenantId,req.user?.id??'system',req.body); await incrementUsage({ tenantId, metric: "jobsCount", amount: 1 }); return successResponse(res,row,'Created',201); });
export const getJobById = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const row=await findTenantScopedById(JobModel,tenantId,req.params.id); if(!row) throw new ApiError('Not found',404,'NOT_FOUND'); return successResponse(res,row); });
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
