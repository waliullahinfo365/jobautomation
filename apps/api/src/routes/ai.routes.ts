import { Router } from "express";
import { getAiConfig, getAiUsage, testAi } from "../controllers/ai.controller";
import { requireAnyPermission, requirePermission } from "../middleware/rbac.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { aiTestBodySchema } from "../validators/ai.validator";

export const aiRoutes = Router();

aiRoutes.get("/config", requireAnyPermission(["integrations.read", "settings.read"]), getAiConfig);
aiRoutes.get("/usage", requireAnyPermission(["reports.read", "billing.read"]), getAiUsage);
aiRoutes.post("/test", requirePermission("integrations.connect"), validateBody(aiTestBodySchema), testAi);
