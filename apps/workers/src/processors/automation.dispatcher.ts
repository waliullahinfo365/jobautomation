import type { AutomationJobName, AutomationJobPayload } from "@shared/types/queue";
import { processAiProcessingJob } from "./ai-processing.processor";
import { processAppliedStatusJob } from "./applied-status.processor";
import { processCvRoutingJob } from "./cv-routing.processor";
import { processDuplicateProtectionProcessor } from "./duplicate-protection.processor";
import { processEmailReplyDetectionJob } from "./email-reply-detection.processor";
import { processFollowUpReminderJob } from "./follow-up-reminder.processor";
import { processFolderAutomationJob } from "./folder-automation.processor";
import { processInterviewSchedulingJob } from "./interview-scheduling.processor";
import { processJobIntakeProcessor } from "./job-intake.processor";
import { processPdfExportJob } from "./pdf-export.processor";
import { processResearchGenerationJob } from "./research-document.processor";
import { processDailyDigestJob } from "./daily-digest.processor";
import { processWeeklyReportJob } from "./weekly-report.processor";

export async function dispatchAutomationJob(name: AutomationJobName, payload: AutomationJobPayload) {
  switch (name) {
    case "job-intake":
      return processJobIntakeProcessor({ tenantId: payload.tenantId, userId: payload.userId ?? "system", payload: {} as never, correlationId: payload.correlationId });
    case "duplicate-protection":
      return processDuplicateProtectionProcessor({ tenantId: payload.tenantId, jobId: (payload as { jobId: string }).jobId, correlationId: payload.correlationId });
    case "folder-automation":
      return processFolderAutomationJob({ tenantId: payload.tenantId, jobId: (payload as { jobId: string }).jobId, userId: payload.userId ?? "system", operationId: payload.operationId });
    case "applied-status":
      return processAppliedStatusJob({ tenantId: payload.tenantId, applicationId: (payload as { applicationId: string }).applicationId, userId: payload.userId ?? "system", operationId: payload.operationId });
    case "interview-scheduling":
      return processInterviewSchedulingJob({ tenantId: payload.tenantId, interviewId: (payload as { interviewId: string }).interviewId, userId: payload.userId ?? "system", operationId: payload.operationId });
    case "cv-routing":
      return processCvRoutingJob({ tenantId: payload.tenantId, documentId: (payload as { documentId: string }).documentId, jobId: (payload as { jobId: string }).jobId, userId: payload.userId ?? "system", operationId: payload.operationId });
    case "email-reply-detection":
      return processEmailReplyDetectionJob({
        tenantId: payload.tenantId,
        providerMessageId: (payload as { providerMessageId: string }).providerMessageId,
        providerThreadId: (payload as { providerThreadId?: string }).providerThreadId,
        from: "stub@example.local",
        subject: "Stub Email Reply",
        bodyText: "Stub body",
        receivedAt: payload.requestedAt,
        operationId: payload.operationId,
      });
    case "follow-up-reminder":
      return processFollowUpReminderJob({ tenantId: payload.tenantId, operationId: payload.operationId, now: (payload as { date?: string }).date });
    case "pdf-export":
      return processPdfExportJob({ tenantId: payload.tenantId, documentId: (payload as { documentId: string }).documentId, userId: payload.userId ?? "system", operationId: payload.operationId });
    case "research-document":
      return processResearchGenerationJob({ tenantId: payload.tenantId, jobId: (payload as { jobId: string }).jobId, userId: payload.userId ?? "system", mode: (payload as { mode?: "research" | "draft" }).mode ?? "research", correlationId: payload.correlationId });
    case "ai-processing":
      return processAiProcessingJob({ tenantId: payload.tenantId, jobId: (payload as { jobId: string }).jobId, userId: payload.userId ?? "system", mode: (payload as { mode?: "research" | "draft" | "full" }).mode ?? "full", correlationId: payload.correlationId });
    case "daily-digest":
      return processDailyDigestJob({ tenantId: payload.tenantId, userId: payload.userId ?? "system", date: (payload as { date?: string }).date, send: (payload as { send?: boolean }).send, force: (payload as { force?: boolean }).force, operationId: payload.operationId });
    case "weekly-report":
      return processWeeklyReportJob({
        tenantId: payload.tenantId,
        userId: payload.userId ?? "system",
        weekStart: (payload as { weekStart?: string }).weekStart,
        weekEnd: (payload as { weekEnd?: string }).weekEnd,
        send: (payload as { send?: boolean }).send,
        force: (payload as { force?: boolean }).force,
        operationId: payload.operationId,
      });
    case "network-follow-up":
    case "offer-tracking":
    case "deadline-alert":
    case "lifecycle-monitoring":
      return {
        queued: true,
        moduleKey: name,
        operationId: payload.operationId,
        status: "not-implemented",
        message: `${name} dispatcher is not implemented yet`,
      };
    default:
      return {
        queued: false,
        moduleKey: name,
        operationId: payload.operationId,
        status: "unknown-module",
        message: "Unknown automation module",
      };
  }
}
