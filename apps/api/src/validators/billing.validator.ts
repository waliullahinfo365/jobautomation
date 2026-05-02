import { z } from "zod";

export const billingCheckoutBodySchema = z.object({
  planKey: z.enum(["free_trial", "starter", "pro", "agency", "enterprise"]),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export const billingChangePlanBodySchema = z.object({
  planKey: z.enum(["free_trial", "starter", "pro", "agency", "enterprise"]),
});

export const billingWebhookBodySchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
}).passthrough();
