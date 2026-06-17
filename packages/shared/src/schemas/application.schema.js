"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationUpdateSchema = exports.applicationCreateSchema = void 0;
const zod_1 = require("zod");
const statuses_1 = require("../constants/statuses");
const applicationSources = [
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
const optionalJobId = zod_1.z.preprocess((v) => {
    if (v === "" || v === null || v === undefined)
        return undefined;
    const s = String(v).trim();
    return s.length ? s : undefined;
}, zod_1.z.string().min(1).optional());
const optionalDateApplied = zod_1.z.preprocess((v) => {
    if (v === "" || v === null || v === undefined)
        return undefined;
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return new Date(`${s}T12:00:00.000Z`).toISOString();
    }
    return s;
}, zod_1.z.string().datetime().optional());
exports.applicationCreateSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    createdBy: zod_1.z.string().min(1),
    jobId: optionalJobId,
    company: zod_1.z.string().min(1),
    position: zod_1.z.string().min(1),
    source: zod_1.z.enum(applicationSources).optional(),
    applicationStatus: zod_1.z.enum(statuses_1.applicationStatuses).default("Applied"),
    responseStatus: zod_1.z.enum(statuses_1.responseStatuses).default("No Response"),
    followUpStatus: zod_1.z.enum(statuses_1.followUpStatuses).default("Not Needed"),
    jobUrl: optionalUrl,
    contactEmail: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    dateApplied: optionalDateApplied,
});
exports.applicationUpdateSchema = exports.applicationCreateSchema.partial();
