"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingSchema = void 0;
const zod_1 = require("zod");
const plans_1 = require("../constants/plans");
exports.billingSchema = zod_1.z.object({ tenantId: zod_1.z.string().min(1), plan: zod_1.z.enum(plans_1.subscriptionPlans), status: zod_1.z.enum(["Trialing", "Active", "Past Due", "Cancelled"]), stripeCustomerId: zod_1.z.string().optional(), stripeSubscriptionId: zod_1.z.string().optional() });
