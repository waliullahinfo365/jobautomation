import type { applicationStatuses, followUpStatuses, responseStatuses } from "../constants/statuses";
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ResponseStatus = (typeof responseStatuses)[number];
export type FollowUpStatus = (typeof followUpStatuses)[number];
export type ApplicationWorkflowStatus = "Not Started" | "Queued" | "Completed" | "Failed";
export type EmailReplyClassification = "Positive Reply" | "Negative Reply" | "Auto Reply" | "Interview Intent" | "Offer Intent" | "Needs Review" | "No Response";

export interface Application { id: string; tenantId: string; createdBy: string; jobId: string; company: string; position: string; applicationStatus: ApplicationStatus; responseStatus: ResponseStatus; followUpStatus: FollowUpStatus; dateApplied?: string; followUpDate?: string; contactEmail?: string; lastEmailSubject?: string; lastReplySnippet?: string; responseDetected?: boolean; aiClassification?: string; followUpMessagePreview?: string; reminderStatus?: string; reminderSentDate?: string; appliedAutomationStatus?: ApplicationWorkflowStatus; appliedAutomationCompletedAt?: string; followUpReminderKey?: string; followUpReminderSentAt?: string; followUpReminderLastCheckedAt?: string; followUpReminderError?: string; lastProviderMessageId?: string; providerThreadId?: string; replyDetectedAt?: string; replyClassificationConfidence?: number; replyClassificationReason?: string; lastStatusChangedAt?: string; notes?: string; createdAt: string; updatedAt: string; }

export interface FollowUpReminderResult {
  operationId: string;
  tenantId: string;
  applicationId: string;
  status: "scheduled" | "sent" | "skipped" | "failed";
  followUpDate?: string;
  message: string;
}

export interface EmailReplyPayload {
  provider: "gmail" | "manual" | "test";
  providerMessageId: string;
  providerThreadId?: string;
  from: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
  raw?: Record<string, unknown>;
}

export interface EmailReplyDetectionResult {
  operationId: string;
  tenantId: string;
  applicationId?: string;
  classification: EmailReplyClassification;
  responseStatus: ResponseStatus;
  applicationStatus: ApplicationStatus;
  confidence: number;
  message: string;
}
