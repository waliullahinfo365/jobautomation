import { Router } from "express";
import { jobCreateSchema, jobUpdateSchema } from "@jobflow/shared/schemas";
import {
  aiProcessingStatus,
  analyzeJobForReview,
  archiveJob,
  checkDuplicateJob,
  createJob,
  generateDraft,
  generateResearch,
  getJobById,
  getReviewQueue,
  getPipelineSummary,
  listJobs,
  provisionFolders,
  reviewJob,
  runAiProcessing,
  undoReview,
  updateJob,
  applyToJob,
  getTailoredCv,
  generateTailoredCv,
  generateCvPdf,
  generateCoverLetterPdf,
} from "../controllers/job.controller";
import {
  completeApplyAssistantHandler,
  generateApplyAnswerHandler,
  generateApplyAnswersFromScreenshotHandler,
  getApplyDocumentStatusHandler,
  streamApplyDocumentHandler,
} from "../controllers/apply-assistant.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import { aiProcessingRunSchema } from "../validators/ai-processing.validator";
import { jobIdParamSchema, listQuerySchema } from "../validators/common.validator";

export const jobRoutes = Router();

jobRoutes.get("/", requirePermission("jobs.read"), validateQuery(listQuerySchema), listJobs);
jobRoutes.get("/pipeline/summary", requirePermission("jobs.read"), getPipelineSummary);
/** Static path before `/:id` so it is never captured as an id segment. */
jobRoutes.get("/review/queue", requirePermission("jobs.read"), getReviewQueue);
jobRoutes.post("/", requirePermission("jobs.create"), validateBody(jobCreateSchema), createJob);
jobRoutes.get("/:id", requirePermission("jobs.read"), validateParams(jobIdParamSchema), getJobById);
jobRoutes.patch("/:id", requirePermission("jobs.update"), validateParams(jobIdParamSchema), validateBody(jobUpdateSchema), updateJob);
jobRoutes.delete("/:id/archive", requirePermission("jobs.archive"), validateParams(jobIdParamSchema), archiveJob);
jobRoutes.post("/:id/check-duplicate", requirePermission("jobs.read"), validateParams(jobIdParamSchema), checkDuplicateJob);
jobRoutes.post("/:id/generate-research", requirePermission("jobs.update"), validateParams(jobIdParamSchema), generateResearch);
jobRoutes.post("/:id/generate-draft", requirePermission("jobs.update"), validateParams(jobIdParamSchema), generateDraft);
jobRoutes.post("/:id/folders/provision", requirePermission("jobs.update"), validateParams(jobIdParamSchema), provisionFolders);
jobRoutes.post(
  "/:id/ai-processing/run",
  requirePermission("jobs.update"),
  validateParams(jobIdParamSchema),
  validateBody(aiProcessingRunSchema),
  runAiProcessing
);
jobRoutes.get("/:id/ai-processing/status", requirePermission("jobs.read"), validateParams(jobIdParamSchema), aiProcessingStatus);

// Quick Review routes (queue registered above `/:id`)
jobRoutes.patch("/:id/review", requirePermission("jobs.update"), validateParams(jobIdParamSchema), reviewJob);
jobRoutes.post("/:id/review/undo", requirePermission("jobs.update"), validateParams(jobIdParamSchema), undoReview);
jobRoutes.post("/:id/review/analyze", requirePermission("jobs.read"), validateParams(jobIdParamSchema), analyzeJobForReview);

// Automated apply route
jobRoutes.post("/:id/apply", requirePermission("jobs.update"), validateParams(jobIdParamSchema), applyToJob);

// Manual apply assistant
jobRoutes.get(
  "/:id/apply/documents/status",
  requirePermission("jobs.read"),
  validateParams(jobIdParamSchema),
  getApplyDocumentStatusHandler
);
jobRoutes.get(
  "/:id/apply/documents/:role/stream",
  requirePermission("jobs.read"),
  validateParams(jobIdParamSchema),
  streamApplyDocumentHandler
);
jobRoutes.post(
  "/:id/apply/generate-answer",
  requirePermission("jobs.update"),
  validateParams(jobIdParamSchema),
  generateApplyAnswerHandler
);
jobRoutes.post(
  "/:id/apply/generate-answers-from-screenshot",
  requirePermission("jobs.update"),
  validateParams(jobIdParamSchema),
  generateApplyAnswersFromScreenshotHandler
);
jobRoutes.post(
  "/:id/apply/complete",
  requirePermission("jobs.update"),
  validateParams(jobIdParamSchema),
  completeApplyAssistantHandler
);

// Tailor CV routes
jobRoutes.get("/:id/tailor-cv", requirePermission("jobs.read"), validateParams(jobIdParamSchema), getTailoredCv);
jobRoutes.post("/:id/tailor-cv", requirePermission("jobs.update"), validateParams(jobIdParamSchema), generateTailoredCv);
jobRoutes.post("/:id/cv-pdf", requirePermission("jobs.read"), validateParams(jobIdParamSchema), generateCvPdf);
jobRoutes.post("/:id/cover-letter-pdf", requirePermission("jobs.read"), validateParams(jobIdParamSchema), generateCoverLetterPdf);
