import { Router } from "express";
import { interviewCreateSchema, interviewUpdateSchema } from "@jobflow/shared/schemas";
import {
  createCalendarEvent,
  createInterview,
  getInterviewById,
  listInterviews,
  markComplete,
  updateInterview,
} from "../controllers/interview.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import { interviewIdParamSchema, listQuerySchema } from "../validators/common.validator";

export const interviewRoutes = Router();

interviewRoutes.get("/", requirePermission("interviews.read"), validateQuery(listQuerySchema), listInterviews);
interviewRoutes.post("/", requirePermission("interviews.create"), validateBody(interviewCreateSchema), createInterview);
interviewRoutes.get("/:id", requirePermission("interviews.read"), validateParams(interviewIdParamSchema), getInterviewById);
interviewRoutes.patch(
  "/:id",
  requirePermission("interviews.update"),
  validateParams(interviewIdParamSchema),
  validateBody(interviewUpdateSchema),
  updateInterview
);
interviewRoutes.post(
  "/:id/create-calendar-event",
  requirePermission("interviews.update"),
  validateParams(interviewIdParamSchema),
  createCalendarEvent
);
interviewRoutes.post("/:id/mark-complete", requirePermission("interviews.update"), validateParams(interviewIdParamSchema), markComplete);
