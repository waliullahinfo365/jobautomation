import { z } from "zod";

export const intakeEmailSchema = z.object({
  provider: z.enum(["gmail", "manual", "test"]),
  providerMessageId: z.string().min(1),
  providerThreadId: z.string().optional(),
  from: z.string().min(1),
  subject: z.string().min(1),
  bodyText: z.string().min(1),
  receivedAt: z.string().min(1),
  labels: z.array(z.string()).optional(),
  raw: z.record(z.unknown()).optional(),
});

export const intakeTestSchema = z.object({
  from: z.string().min(1),
  subject: z.string().min(1),
  bodyText: z.string().min(1),
});
