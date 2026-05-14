import { Router } from "express";
import { backfillJobIntake, getAutomationLogs, getAutomationModulesHealth, listAutomationModules, runAutomationModule, updateAutomationModule } from "../controllers/automation.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import { automationRunBodySchema } from "../validators/ai-processing.validator";
import { listQuerySchema, moduleKeyParamSchema } from "../validators/common.validator";

export const automationRoutes = Router();

automationRoutes.get("/modules", requirePermission("automation.read"), validateQuery(listQuerySchema), listAutomationModules);
automationRoutes.get("/modules/health", requirePermission("automation.read"), getAutomationModulesHealth);
automationRoutes.patch(
  "/modules/:moduleKey",
  requirePermission("automation.update"),
  validateParams(moduleKeyParamSchema),
  updateAutomationModule
);
automationRoutes.post(
  "/modules/:moduleKey/run",
  requirePermission("automation.run"),
  validateParams(moduleKeyParamSchema),
  validateBody(automationRunBodySchema),
  runAutomationModule
);
automationRoutes.get("/logs", requirePermission("automation.read"), validateQuery(listQuerySchema), getAutomationLogs);
automationRoutes.post("/job-intake/backfill", requirePermission("automation.run"), backfillJobIntake);
