"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentUpdateSchema = exports.documentCreateSchema = void 0;
const zod_1 = require("zod");
const statuses_1 = require("../constants/statuses");
const optionalJobId = zod_1.z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));
exports.documentCreateSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    createdBy: zod_1.z.string().min(1),
    fileName: zod_1.z.string().min(1),
    type: zod_1.z.enum(statuses_1.documentTypes),
    status: zod_1.z.enum(statuses_1.documentStatuses).default("Draft"),
    jobId: optionalJobId,
    applicationId: optionalJobId,
    contentText: zod_1.z.string().max(600_000).optional(),
    documentKind: zod_1.z.enum(["Research", "Cover Letter", "CV", "PDF Export", "Other"]).optional(),
    storageProvider: zod_1.z.string().optional(),
    storagePath: zod_1.z.string().optional(),
    storageLocation: zod_1.z.string().optional(),
    storageUrl: zod_1.z.string().optional(),
    driveFileId: zod_1.z.string().optional(),
    driveFileLink: zod_1.z.string().optional(),
    googleDriveFileId: zod_1.z.string().optional(),
    googleDriveFolderId: zod_1.z.string().optional(),
    profileDocumentType: zod_1.z.enum(["cv_resume", "cover_letter_template", "supporting_document"]).optional(),
    isActiveProfileDocument: zod_1.z.boolean().optional(),
    sourceFileName: zod_1.z.string().optional(),
    extractionStatus: zod_1.z.enum(["Provided", "Failed", "Not Required"]).optional(),
    extractionError: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(5000).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.documentUpdateSchema = exports.documentCreateSchema.partial();
