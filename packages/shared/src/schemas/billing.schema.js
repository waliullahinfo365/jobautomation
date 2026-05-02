import { z } from "zod";
import { subscriptionPlans } from "../constants/plans";
export const billingSchema = z.object({ tenantId: z.string().min(1), plan: z.enum(subscriptionPlans), status: z.enum(["Trialing", "Active", "Past Due", "Cancelled"]), stripeCustomerId: z.string().optional(), stripeSubscriptionId: z.string().optional() });
