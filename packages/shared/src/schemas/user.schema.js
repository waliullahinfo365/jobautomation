"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userUpdateSchema = exports.userCreateSchema = void 0;
const zod_1 = require("zod");
const plans_1 = require("../constants/plans");
const statuses_1 = require("../constants/statuses");
exports.userCreateSchema = zod_1.z.object({ tenantId: zod_1.z.string().min(1), name: zod_1.z.string().min(1), email: zod_1.z.string().email(), passwordHash: zod_1.z.string().min(8), role: zod_1.z.enum(plans_1.tenantRoles), status: zod_1.z.enum(statuses_1.userStatuses).default("Invited") });
exports.userUpdateSchema = exports.userCreateSchema.partial();
