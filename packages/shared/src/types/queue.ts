export type AutomationJobName =
  | "job-intake"
  | "duplicate-protection"
  | "folder-automation"
  | "applied-status"
  | "interview-scheduling"
  | "cv-routing"
  | "email-reply-detection"
  | "follow-up-reminder"
  | "pdf-export"
  | "research-document"
  | "ai-processing"
  | "network-follow-up"
  | "offer-tracking"
  | "deadline-alert"
  | "lifecycle-monitoring"
  | "daily-digest"
  | "weekly-report";

export interface BaseAutomationJobPayload {
  tenantId: string;
  userId?: string;
  operationId: string;
  correlationId?: string;
  idempotencyKey?: string;
  requestedAt: string;
  source: "api" | "scheduler" | "webhook" | "system";
}

export interface JobIntakeJobPayload extends BaseAutomationJobPayload {
  providerMessageId?: string;
}
export interface DuplicateProtectionJobPayload extends BaseAutomationJobPayload {
  jobId: string;
}
export interface FolderAutomationJobPayload extends BaseAutomationJobPayload {
  jobId: string;
}
export interface AppliedStatusJobPayload extends BaseAutomationJobPayload {
  applicationId: string;
}
export interface InterviewSchedulingJobPayload extends BaseAutomationJobPayload {
  interviewId: string;
}
export interface CvRoutingJobPayload extends BaseAutomationJobPayload {
  documentId: string;
  jobId: string;
}
export interface EmailReplyDetectionJobPayload extends BaseAutomationJobPayload {
  providerMessageId: string;
  providerThreadId?: string;
}
export interface FollowUpReminderJobPayload extends BaseAutomationJobPayload {
  applicationId?: string;
  date?: string;
}
export interface PdfExportJobPayload extends BaseAutomationJobPayload {
  documentId: string;
}
export interface ResearchDocumentJobPayload extends BaseAutomationJobPayload {
  jobId: string;
  mode?: "research" | "draft";
}
export interface AiProcessingJobPayload extends BaseAutomationJobPayload {
  jobId: string;
  mode?: "research" | "draft" | "full";
}
export interface NetworkFollowUpJobPayload extends BaseAutomationJobPayload {
  date?: string;
}
export interface OfferTrackingJobPayload extends BaseAutomationJobPayload {
  date?: string;
}
export interface DeadlineAlertJobPayload extends BaseAutomationJobPayload {
  date?: string;
}
export interface LifecycleMonitoringJobPayload extends BaseAutomationJobPayload {
  date?: string;
}
export interface DailyDigestJobPayload extends BaseAutomationJobPayload {
  date?: string;
  send?: boolean;
  force?: boolean;
}
export interface WeeklyReportJobPayload extends BaseAutomationJobPayload {
  weekStart?: string;
  weekEnd?: string;
  send?: boolean;
  force?: boolean;
}

export type AutomationJobPayload =
  | JobIntakeJobPayload
  | DuplicateProtectionJobPayload
  | FolderAutomationJobPayload
  | AppliedStatusJobPayload
  | InterviewSchedulingJobPayload
  | CvRoutingJobPayload
  | EmailReplyDetectionJobPayload
  | FollowUpReminderJobPayload
  | PdfExportJobPayload
  | ResearchDocumentJobPayload
  | AiProcessingJobPayload
  | NetworkFollowUpJobPayload
  | OfferTrackingJobPayload
  | DeadlineAlertJobPayload
  | LifecycleMonitoringJobPayload
  | DailyDigestJobPayload
  | WeeklyReportJobPayload;

export interface EnqueueAutomationJobInput {
  name: AutomationJobName;
  payload: AutomationJobPayload;
  delayMs?: number;
  priority?: number;
  attempts?: number;
}

export interface AutomationQueueResult {
  operationId: string;
  jobId: string;
  name: AutomationJobName;
  status: "queued" | "scheduled" | "skipped";
  message: string;
}
