import { z } from "zod";
import { subscriptionPlans } from "../constants/plans";
import { tenantStatuses } from "../constants/statuses";
export const tenantCreateSchema = z.object({ name: z.string().min(2), slug: z.string().min(2), ownerId: z.string().min(1), plan: z.enum(subscriptionPlans), status: z.enum(tenantStatuses).default("Trialing") });
export const tenantUpdateSchema = tenantCreateSchema.partial();
