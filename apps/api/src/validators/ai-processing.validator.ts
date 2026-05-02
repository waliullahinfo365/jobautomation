import { z } from "zod";

export const aiProcessingRunSchema = z.object({
  jobId: z.string().min(1).optional(),
  mode: z.enum(["research", "draft", "full"]),
});

export const automationRunBodySchema = z.object({
  applicationId: z.string().optional(),
  jobId: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
  interviewId: z.string().min(1).optional(),
  date: z.string().optional(),
  weekStart: z.string().optional(),
  weekEnd: z.string().optional(),
  send: z.boolean().optional(),
  force: z.boolean().optional(),
  mode: z.enum(["research", "draft", "full"]).optional(),
  replyPayload: z
    .object({
      providerMessageId: z.string().optional(),
      providerThreadId: z.string().optional(),
      from: z.string().optional(),
      subject: z.string().optional(),
      bodyText: z.string().optional(),
      receivedAt: z.string().optional(),
    })
    .optional(),
  execute: z.boolean().optional(),
});

export const routeCvBodySchema = z.object({
  jobId: z.string().min(1),
});
