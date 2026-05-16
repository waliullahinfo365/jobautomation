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
  listJobs,
  provisionFolders,
  reviewJob,
  runAiProcessing,
  undoReview,
  updateJob,
  applyToJob,
} from "../controllers/job.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import { aiProcessingRunSchema } from "../validators/ai-processing.validator";
import { jobIdParamSchema, listQuerySchema } from "../validators/common.validator";

export const jobRoutes = Router();

jobRoutes.get("/", requirePermission("jobs.read"), validateQuery(listQuerySchema), listJobs);
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

// Quick Review routes
jobRoutes.get("/review/queue", requirePermission("jobs.read"), getReviewQueue);
jobRoutes.patch("/:id/review", requirePermission("jobs.update"), validateParams(jobIdParamSchema), reviewJob);
jobRoutes.post("/:id/review/undo", requirePermission("jobs.update"), validateParams(jobIdParamSchema), undoReview);
jobRoutes.post("/:id/review/analyze", requirePermission("jobs.read"), validateParams(jobIdParamSchema), analyzeJobForReview);

// Automated apply route
jobRoutes.post("/:id/apply", requirePermission("jobs.update"), validateParams(jobIdParamSchema), applyToJob);
