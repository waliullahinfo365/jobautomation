import { z } from "zod";
import { tenantRoles } from "../constants/plans";
import { userStatuses } from "../constants/statuses";
export const userCreateSchema = z.object({ tenantId: z.string().min(1), name: z.string().min(1), email: z.string().email(), passwordHash: z.string().min(8), role: z.enum(tenantRoles), status: z.enum(userStatuses).default("Invited") });
export const userUpdateSchema = userCreateSchema.partial();
