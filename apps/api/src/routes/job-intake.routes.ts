import { Router } from "express";
import { intakeEmail, intakeTest } from "../controllers/job-intake.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { intakeEmailSchema, intakeTestSchema } from "../validators/job-intake.validator";

export const jobIntakeRoutes = Router();

jobIntakeRoutes.post("/jobs/intake-email", requirePermission("jobs.create"), validateBody(intakeEmailSchema), intakeEmail);
jobIntakeRoutes.post("/jobs/intake-test", requirePermission("jobs.create"), validateBody(intakeTestSchema), intakeTest);
