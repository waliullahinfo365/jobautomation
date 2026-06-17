"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactUpdateSchema = exports.contactCreateSchema = void 0;
const zod_1 = require("zod");
const statuses_1 = require("../constants/statuses");
exports.contactCreateSchema = zod_1.z.object({ tenantId: zod_1.z.string().min(1), createdBy: zod_1.z.string().min(1), name: zod_1.z.string().min(1), relationship: zod_1.z.enum(statuses_1.contactRelationships), email: zod_1.z.string().email().optional(), followUpStatus: zod_1.z.enum(statuses_1.followUpStatuses).default("Not Needed") });
exports.contactUpdateSchema = exports.contactCreateSchema.partial();
