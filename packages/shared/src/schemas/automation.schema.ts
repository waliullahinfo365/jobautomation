import { z } from "zod";
import { automationCategories, automationModuleKeys } from "../constants/statuses";
export const automationSettingsSchema = z.object({ tenantId: z.string().min(1), createdBy: z.string().min(1), moduleKey: z.enum(automationModuleKeys), category: z.enum(automationCategories), enabled: z.boolean(), schedule: z.string().optional(), configuration: z.record(z.string(), z.unknown()).optional() });
export const automationSettingsUpdateSchema = automationSettingsSchema.partial();
