import { Router } from "express";
import { requireRole } from "../middleware/rbac.middleware";
import { getDebugDataCounts, requireAdminResetToken, resetOperationalData } from "../controllers/admin.controller";

export const adminRoutes = Router();

adminRoutes.post(
  "/workspace/reset-operational-data",
  requireRole("Owner"),
  requireAdminResetToken,
  resetOperationalData
);

adminRoutes.get(
  "/debug/data-counts",
  requireRole("Owner"),
  requireAdminResetToken,
  getDebugDataCounts
);
