import { Router } from "express";
import { getTodaySummaryHandler } from "../controllers/today.controller";
import { requireAnyPermission } from "../middleware/rbac.middleware";

export const todayRoutes = Router();

todayRoutes.get("/summary", requireAnyPermission(["jobs.read", "tenant.read"]), getTodaySummaryHandler);
