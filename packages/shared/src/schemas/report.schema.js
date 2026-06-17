"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportSchema = void 0;
const zod_1 = require("zod");
const statuses_1 = require("../constants/statuses");
exports.reportSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    createdBy: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(statuses_1.reportTypes),
    status: zod_1.z.enum(statuses_1.reportStatuses),
    periodKey: zod_1.z.string().optional(),
    periodStart: zod_1.z.string().optional(),
    periodEnd: zod_1.z.string().optional(),
    deliveryStatus: zod_1.z.enum(["Not Sent", "Queued", "Sent", "Failed"]).optional(),
    summaryText: zod_1.z.string().optional(),
    metrics: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    recommendations: zod_1.z.array(zod_1.z.string()).optional(),
    generatedBy: zod_1.z.string().optional(),
    idempotencyKey: zod_1.z.string().optional(),
});
