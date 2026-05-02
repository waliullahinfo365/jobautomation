import { AutomationModuleModel } from "@jobflow/database/models";
import { normalizeGmailReply } from "@jobflow/integrations/gmail/gmail.service";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paginatedResponse, successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "../services/baseTenant.service";
import { getPagination } from "../utils/pagination";
import { listAutomationLogs, logApiAction } from "../services/automation-log.service";
import { runDraftGeneration, runFullAiProcessing, runResearchGeneration } from "../services/ai-processing.service";
import { markApplicationApplied } from "../services/applied-status.service";
import { processEmailReply } from "../services/email-reply-detection.service";
import { processDueFollowUpsForTenant } from "../services/follow-up-reminder.service";
import { provisionJobFolders } from "../services/folder-automation.service";
import { routeCvToJobFolder } from "../services/cv-routing.service";
import { exportDocumentPdf } from "../services/pdf-export.service";
import { createInterviewCalendarEvent } from "../services/interview-scheduling.service";
import { generateDailyDigest, generateWeeklyReport } from "../services/report-generation.service";
import { enqueueAutomationModule } from "../services/automation-queue.service";
import { logTenantAudit } from "../services/audit-log.service";
import type { AutomationJobName } from "@jobflow/shared/types/queue";
export const listAutomationModules = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const {page,limit,skip}=getPagination(req.query); const filter:Record<string,unknown>={tenantId}; if(typeof req.query.status==='string') filter.status=req.query.status; const [rows,total]=await Promise.all([AutomationModuleModel.find(filter).sort({updatedAt:-1}).skip(skip).limit(limit),AutomationModuleModel.countDocuments(filter)]); return paginatedResponse(res,rows,{page,limit,total,totalPages:Math.ceil(total/limit)}); });
export const updateAutomationModule = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const row=await AutomationModuleModel.findOneAndUpdate({tenantId,moduleKey:req.params.moduleKey},req.body,{new:true}); if(!row) throw new ApiError('Automation module not found',404,'NOT_FOUND'); return successResponse(res,row,'Automation module updated'); });
export const runAutomationModule = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const operationId = `${req.params.moduleKey}-${Date.now()}`;
  const moduleKey = req.params.moduleKey as AutomationJobName;
  const mode = typeof req.body?.mode === "string" ? req.body.mode : undefined;
  const jobId = typeof req.body?.jobId === "string" ? req.body.jobId : undefined;
  const applicationId = typeof req.body?.applicationId === "string" ? req.body.applicationId : undefined;
  const documentId = typeof req.body?.documentId === "string" ? req.body.documentId : undefined;
  const interviewId = typeof req.body?.interviewId === "string" ? req.body.interviewId : undefined;
  const date = typeof req.body?.date === "string" ? req.body.date : undefined;
  const weekStart = typeof req.body?.weekStart === "string" ? req.body.weekStart : undefined;
  const weekEnd = typeof req.body?.weekEnd === "string" ? req.body.weekEnd : undefined;
  const send = req.body?.send === true;
  const force = req.body?.force === true;
  const shouldExecute = req.query.execute === "true" || req.body?.execute === true;
  const userId = req.user?.id ?? "system";

  const allModules: AutomationJobName[] = [
    "job-intake",
    "duplicate-protection",
    "folder-automation",
    "applied-status",
    "interview-scheduling",
    "cv-routing",
    "email-reply-detection",
    "follow-up-reminder",
    "pdf-export",
    "research-document",
    "ai-processing",
    "network-follow-up",
    "offer-tracking",
    "deadline-alert",
    "lifecycle-monitoring",
    "daily-digest",
    "weekly-report",
  ];

  if (!allModules.includes(moduleKey)) throw new ApiError("Unsupported automation module", 422, "VALIDATION_ERROR");

  if (shouldExecute) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("Direct execute=true is disabled in production; enqueue only", 403, "FORBIDDEN");
    }
    if (moduleKey === "ai-processing") {
      if (!jobId || !mode) throw new ApiError("jobId and mode are required when execute=true", 422, "VALIDATION_ERROR");
      const result =
        mode === "research"
          ? await runResearchGeneration({ tenantId, jobId, userId, operationId })
          : mode === "draft"
            ? await runDraftGeneration({ tenantId, jobId, userId, operationId })
            : await runFullAiProcessing({ tenantId, jobId, userId, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "Automation executed");
    }
    if (moduleKey === "applied-status") {
      if (!applicationId) throw new ApiError("applicationId is required when execute=true", 422, "VALIDATION_ERROR");
      const result = await markApplicationApplied({ tenantId, applicationId, userId, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "Applied status executed");
    }
    if (moduleKey === "follow-up-reminder") {
      const result = await processDueFollowUpsForTenant({ tenantId, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "Follow-up reminder executed");
    }
    if (moduleKey === "email-reply-detection") {
      const payload = req.body.replyPayload ? normalizeGmailReply({ provider: "test", ...req.body.replyPayload }) : undefined;
      if (!payload?.providerMessageId || !payload.from || !payload.subject || !payload.bodyText || !payload.receivedAt) {
        throw new ApiError("replyPayload with providerMessageId/from/subject/bodyText/receivedAt is required when execute=true", 422, "VALIDATION_ERROR");
      }
      const result = await processEmailReply({ tenantId, payload, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "Email reply detection executed");
    }
    if (moduleKey === "folder-automation") {
      if (!jobId) throw new ApiError("jobId is required when execute=true", 422, "VALIDATION_ERROR");
      const result = await provisionJobFolders({ tenantId, jobId, userId, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "Folder automation executed");
    }
    if (moduleKey === "cv-routing") {
      if (!documentId || !jobId) throw new ApiError("documentId and jobId are required when execute=true", 422, "VALIDATION_ERROR");
      const result = await routeCvToJobFolder({ tenantId, documentId, jobId, userId, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "CV routing executed");
    }
    if (moduleKey === "pdf-export") {
      if (!documentId) throw new ApiError("documentId is required when execute=true", 422, "VALIDATION_ERROR");
      const result = await exportDocumentPdf({ tenantId, documentId, userId, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "PDF export executed");
    }
    if (moduleKey === "interview-scheduling") {
      if (!interviewId) throw new ApiError("interviewId is required when execute=true", 422, "VALIDATION_ERROR");
      const result = await createInterviewCalendarEvent({ tenantId, interviewId, userId, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "Interview scheduling executed");
    }
    if (moduleKey === "daily-digest") {
      const result = await generateDailyDigest({ tenantId, userId, date, send, force, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "Daily digest executed");
    }
    if (moduleKey === "weekly-report") {
      const result = await generateWeeklyReport({ tenantId, userId, weekStart, weekEnd, send, force, operationId });
      return successResponse(res, { operationId, moduleKey, status: "completed", result }, "Weekly report executed");
    }
  }

  const queued = await enqueueAutomationModule({
    tenantId,
    userId,
    moduleKey,
    payload: {
      mode,
      jobId,
      applicationId,
      documentId,
      interviewId,
      date,
      weekStart,
      weekEnd,
      send,
      force,
      providerMessageId: req.body?.replyPayload?.providerMessageId,
      providerThreadId: req.body?.replyPayload?.providerThreadId,
      correlationId: req.body?.correlationId,
    },
    source: "api",
    operationId,
  });
  await logApiAction({
    tenantId,
    moduleKey,
    status: "Running",
    message: queued.message,
    metadata: { operationId: queued.operationId, jobId: queued.jobId, queueStatus: queued.status },
  });
  void logTenantAudit(req, "automation.module.run", {
    entityType: "AutomationModule",
    entityId: moduleKey,
    message: "Automation run queued",
    metadata: { operationId: queued.operationId, jobId: queued.jobId },
  });
  return successResponse(
    res,
    { operationId: queued.operationId, jobId: queued.jobId, moduleKey, status: queued.status, message: queued.message },
    "Automation queued"
  );
});
export const getAutomationLogs = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const logs=await listAutomationLogs(tenantId,{ moduleKey: typeof req.query.moduleKey==='string'?req.query.moduleKey:undefined, status: typeof req.query.status==='string'?req.query.status:undefined, limit: typeof req.query.limit==='string'?Number(req.query.limit):undefined }); return successResponse(res,logs); });
