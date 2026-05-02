import { Router } from "express";
import { applicationCreateSchema, applicationUpdateSchema } from "@jobflow/shared/schemas";
import {
  createApplication,
  getApplicationById,
  listApplications,
  listDueFollowUps,
  markApplied,
  markFollowUpSent,
  processDueFollowUps,
  scheduleFollowUp,
  updateApplication,
} from "../controllers/application.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import {
  dueFollowUpsQuerySchema,
  markAppliedBodySchema,
  markFollowUpSentBodySchema,
  processDueFollowUpsBodySchema,
  scheduleFollowUpBodySchema,
} from "../validators/application-workflow.validator";
import { idParamSchema, listQuerySchema } from "../validators/common.validator";

export const applicationRoutes = Router();

applicationRoutes.get("/", requirePermission("applications.read"), validateQuery(listQuerySchema), listApplications);
applicationRoutes.get("/follow-ups/due", requirePermission("applications.read"), validateQuery(dueFollowUpsQuerySchema), listDueFollowUps);
applicationRoutes.post(
  "/follow-ups/process-due",
  requirePermission("applications.update"),
  validateBody(processDueFollowUpsBodySchema),
  processDueFollowUps
);
applicationRoutes.post("/", requirePermission("applications.create"), validateBody(applicationCreateSchema), createApplication);
applicationRoutes.get("/:id", requirePermission("applications.read"), validateParams(idParamSchema), getApplicationById);
applicationRoutes.patch(
  "/:id",
  requirePermission("applications.update"),
  validateParams(idParamSchema),
  validateBody(applicationUpdateSchema),
  updateApplication
);
applicationRoutes.post(
  "/:id/mark-applied",
  requirePermission("applications.update"),
  validateParams(idParamSchema),
  validateBody(markAppliedBodySchema),
  markApplied
);
applicationRoutes.post(
  "/:id/schedule-follow-up",
  requirePermission("applications.update"),
  validateParams(idParamSchema),
  validateBody(scheduleFollowUpBodySchema),
  scheduleFollowUp
);
applicationRoutes.post(
  "/:id/mark-follow-up-sent",
  requirePermission("applications.update"),
  validateParams(idParamSchema),
  validateBody(markFollowUpSentBodySchema),
  markFollowUpSent
);
