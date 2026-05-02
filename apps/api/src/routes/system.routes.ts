import { Router } from "express";
import { getSystemStatus } from "../controllers/system.controller";
import { requireAnyPermission } from "../middleware/rbac.middleware";

export const systemRoutes = Router();

systemRoutes.get("/system/status", requireAnyPermission(["settings.read", "automation.read"]), getSystemStatus);
