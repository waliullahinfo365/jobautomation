import { z } from "zod";
import { documentStatuses, documentTypes } from "../constants/statuses";

const optionalJobId = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));

export const documentCreateSchema = z.object({
  tenantId: z.string().min(1),
  createdBy: z.string().min(1),
  fileName: z.string().min(1),
  type: z.enum(documentTypes),
  status: z.enum(documentStatuses).default("Draft"),
  jobId: optionalJobId,
  applicationId: optionalJobId,
  contentText: z.string().max(600_000).optional(),
  documentKind: z.enum(["Research", "Cover Letter", "CV", "PDF Export", "Other"]).optional(),
  storageProvider: z.string().optional(),
  storagePath: z.string().optional(),
  storageLocation: z.string().optional(),
  storageUrl: z.string().optional(),
  driveFileId: z.string().optional(),
  driveFileLink: z.string().optional(),
  googleDriveFileId: z.string().optional(),
  googleDriveFolderId: z.string().optional(),
  profileDocumentType: z.enum(["cv_resume", "cover_letter_template", "supporting_document"]).optional(),
  isActiveProfileDocument: z.boolean().optional(),
  sourceFileName: z.string().optional(),
  extractionStatus: z.enum(["Provided", "Failed", "Not Required"]).optional(),
  extractionError: z.string().optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export const documentUpdateSchema = documentCreateSchema.partial();
