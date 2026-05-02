import { z } from "zod";

export const markAppliedBodySchema = z.object({
  appliedAt: z.string().optional(),
});

export const scheduleFollowUpBodySchema = z.object({
  followUpDate: z.string().min(1),
  message: z.string().optional(),
});

export const markFollowUpSentBodySchema = z.object({
  sentAt: z.string().optional(),
});

export const processDueFollowUpsBodySchema = z.object({
  now: z.string().optional(),
  limit: z.number().optional(),
});

export const dueFollowUpsQuerySchema = z.object({
  now: z.string().optional(),
  limit: z.coerce.number().optional(),
});

export const replyTestBodySchema = z.object({
  providerMessageId: z.string().min(1),
  providerThreadId: z.string().optional(),
  from: z.string().min(1),
  subject: z.string().min(1),
  bodyText: z.string().min(1),
  receivedAt: z.string().min(1),
});

export const automationWorkflowRunBodySchema = z.object({
  applicationId: z.string().optional(),
  jobId: z.string().optional(),
  mode: z.enum(["research", "draft", "full"]).optional(),
  replyPayload: replyTestBodySchema.partial().optional(),
});
