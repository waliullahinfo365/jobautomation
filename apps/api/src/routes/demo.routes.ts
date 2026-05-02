import { Router } from "express";
import { postDemoReset } from "../controllers/demo.controller";
import { requirePermission } from "../middleware/rbac.middleware";

export const demoRoutes = Router();

/** Owner/Admin implied in controller; require a baseline automation permission to avoid wide exposure. */
demoRoutes.post("/demo/reset", requirePermission("automation.update"), postDemoReset);
