"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interviewUpdateSchema = exports.interviewCreateSchema = void 0;
const zod_1 = require("zod");
const statuses_1 = require("../constants/statuses");
exports.interviewCreateSchema = zod_1.z.object({ tenantId: zod_1.z.string().min(1), createdBy: zod_1.z.string().min(1), company: zod_1.z.string().min(1), position: zod_1.z.string().min(1), interviewType: zod_1.z.enum(statuses_1.interviewTypes), status: zod_1.z.enum(statuses_1.interviewStatuses).default("Scheduled"), dateTime: zod_1.z.string().datetime(), prepStatus: zod_1.z.enum(statuses_1.prepStatuses).default("Not Started") });
exports.interviewUpdateSchema = exports.interviewCreateSchema.partial();
