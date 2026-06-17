"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationSettingsUpdateSchema = exports.automationSettingsSchema = void 0;
const zod_1 = require("zod");
const statuses_1 = require("../constants/statuses");
exports.automationSettingsSchema = zod_1.z.object({ tenantId: zod_1.z.string().min(1), createdBy: zod_1.z.string().min(1), moduleKey: zod_1.z.enum(statuses_1.automationModuleKeys), category: zod_1.z.enum(statuses_1.automationCategories), enabled: zod_1.z.boolean(), schedule: zod_1.z.string().optional(), configuration: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional() });
exports.automationSettingsUpdateSchema = exports.automationSettingsSchema.partial();
