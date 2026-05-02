import { randomUUID } from "node:crypto";
import { ApplicationModel, JobModel } from "@database/models";
import { classifyReplyRuleBased } from "@integrations/gmail/gmail.service";
import type { EmailReplyDetectionResult, EmailReplyPayload } from "@shared/types/application";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId } from "./baseTenant.service";

export async function findApplicationForReply(tenantId: string, payload: EmailReplyPayload) {
  if (payload.providerThreadId) {
    const byThread = await ApplicationModel.findOne({
      tenantId,
      providerThreadId: payload.providerThreadId,
    });
    if (byThread) return byThread;
  }

  const byEmail = await ApplicationModel.findOne({
    tenantId,
    contactEmail: { $regex: payload.from, $options: "i" },
    applicationStatus: { $in: ["Applied", "Follow-Up Due", "Replied", "Interview", "Offer"] },
  }).sort({ updatedAt: -1 });
  if (byEmail) return byEmail;

  return ApplicationModel.findOne({
    tenantId,
    applicationStatus: { $in: ["Applied", "Follow-Up Due"] },
  }).sort({ updatedAt: -1 });
}

export function classifyEmailReply(payload: EmailReplyPayload) {
  return classifyReplyRuleBased(payload);
}

function mapClassificationToStatuses(classification: string) {
  switch (classification) {
    case "Interview Intent":
      return { responseStatus: "Positive Reply", applicationStatus: "Interview", jobStatus: "Interview" };
    case "Offer Intent":
      return { responseStatus: "Positive Reply", applicationStatus: "Offer", jobStatus: "Offer" };
    case "Negative Reply":
      return { responseStatus: "Negative Reply", applicationStatus: "Rejected", jobStatus: "Rejected" };
    case "Positive Reply":
      return { responseStatus: "Positive Reply", applicationStatus: "Replied", jobStatus: undefined };
    case "Auto Reply":
      return { responseStatus: "Auto Reply", applicationStatus: "Replied", jobStatus: undefined };
    default:
      return { responseStatus: "Needs Review", applicationStatus: "Replied", jobStatus: undefined };
  }
}

export async function processEmailReply(input: {
  tenantId: string;
  payload: EmailReplyPayload;
  operationId?: string;
}): Promise<EmailReplyDetectionResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const payload = input.payload;
  const application = await findApplicationForReply(tenantId, payload);

  if (!application) {
    return {
      operationId,
      tenantId,
      classification: "No Response",
      responseStatus: "Needs Review",
      applicationStatus: "Replied",
      confidence: 0,
      message: "No matching application found for reply",
    };
  }

  if (application.lastProviderMessageId === payload.providerMessageId) {
    return {
      operationId,
      tenantId,
      applicationId: String(application._id),
      classification: "No Response",
      responseStatus: application.responseStatus,
      applicationStatus: application.applicationStatus,
      confidence: 1,
      message: "Reply already processed for this provider message id",
    };
  }

  const cls = classifyEmailReply(payload);
  const mapped = mapClassificationToStatuses(cls.classification);

  await ApplicationModel.findByIdAndUpdate(application._id, {
    responseDetected: true,
    lastProviderMessageId: payload.providerMessageId,
    providerThreadId: payload.providerThreadId,
    lastEmailSubject: payload.subject,
    lastReplySnippet: payload.bodyText.slice(0, 300),
    replyDetectedAt: new Date(payload.receivedAt),
    aiClassification: cls.classification,
    replyClassificationConfidence: cls.confidence,
    replyClassificationReason: cls.reason,
    responseStatus: mapped.responseStatus,
    applicationStatus: mapped.applicationStatus,
    lastStatusChangedAt: new Date(),
  });

  if (mapped.jobStatus && application.jobId) {
    await JobModel.findOneAndUpdate(
      { _id: application.jobId, tenantId },
      { status: mapped.jobStatus, lastStatusChangedAt: new Date() }
    );
  }

  await createAutomationLog({
    tenantId,
    moduleKey: "email-reply-detection",
    moduleName: "Email Reply Detection",
    status: "Success",
    message: `Reply processed: ${cls.classification}`,
    relatedRecordType: "Application",
    relatedRecordId: String(application._id),
    operationId,
    idempotencyKey: `email-reply:${tenantId}:${payload.providerMessageId}`,
  });

  return {
    operationId,
    tenantId,
    applicationId: String(application._id),
    classification: cls.classification,
    responseStatus: mapped.responseStatus as EmailReplyDetectionResult["responseStatus"],
    applicationStatus: mapped.applicationStatus as EmailReplyDetectionResult["applicationStatus"],
    confidence: cls.confidence,
    message: cls.reason,
  };
}
