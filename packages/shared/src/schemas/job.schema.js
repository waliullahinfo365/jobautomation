"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobUpdateSchema = exports.jobCreateSchema = void 0;
const zod_1 = require("zod");
const statuses_1 = require("../constants/statuses");
const jobSources = [
    "LinkedIn",
    "Indeed",
    "Stepstone",
    "Xing",
    "Glassdoor",
    "Monster",
    "Company Website",
    "Referral",
    "Gmail",
    "Manual",
    "Other",
];
const optionalUrl = zod_1.z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), zod_1.z.string().url().optional());
const optionalDeadline = zod_1.z.preprocess((v) => {
    if (v === "" || v === null || v === undefined)
        return undefined;
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return new Date(`${s}T12:00:00.000Z`).toISOString();
    }
    return s;
}, zod_1.z.string().datetime().optional());
exports.jobCreateSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    createdBy: zod_1.z.string().min(1),
    company: zod_1.z.string().min(1),
    position: zod_1.z.string().min(1),
    title: zod_1.z.string().optional(),
    source: zod_1.z.enum(jobSources).default("Manual"),
    status: zod_1.z.enum(statuses_1.jobStatuses).default("New"),
    priority: zod_1.z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
    location: zod_1.z.string().optional(),
    jobUrl: optionalUrl,
    salaryRange: zod_1.z.string().optional(),
    deadline: optionalDeadline,
    description: zod_1.z.string().optional(),
});
exports.jobUpdateSchema = exports.jobCreateSchema.partial();
