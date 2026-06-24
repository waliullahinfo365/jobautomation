import { z } from "zod";

const planKeySchema = z.enum(["free", "plus", "pro", "executive", "founding_pro", "free_trial", "starter", "agency", "enterprise"]);

export const billingCheckoutBodySchema = z.object({
  planKey: planKeySchema,
  billingCycle: z.enum(["monthly", "yearly"]),
});

export const billingChangePlanBodySchema = z.object({
  planKey: planKeySchema,
});

export const billingCreditsCheckoutBodySchema = z.object({
  pack: z.enum(["50", "150"]),
});

export const billingWebhookBodySchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
}).passthrough();
