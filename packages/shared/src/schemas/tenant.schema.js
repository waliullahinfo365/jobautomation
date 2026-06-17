"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantUpdateSchema = exports.tenantCreateSchema = void 0;
const zod_1 = require("zod");
const plans_1 = require("../constants/plans");
const statuses_1 = require("../constants/statuses");
exports.tenantCreateSchema = zod_1.z.object({ name: zod_1.z.string().min(2), slug: zod_1.z.string().min(2), ownerId: zod_1.z.string().min(1), plan: zod_1.z.enum(plans_1.subscriptionPlans), status: zod_1.z.enum(statuses_1.tenantStatuses).default("Trialing") });
exports.tenantUpdateSchema = exports.tenantCreateSchema.partial();
