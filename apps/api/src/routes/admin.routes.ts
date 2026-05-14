import { Router } from "express";
import { requireRole } from "../middleware/rbac.middleware";
import { getDebugDataCounts, requireAdminResetToken, resetOperationalData, cleanupNonJobIntake, recalculateJobsCount, cleanupTestJobsHandler } from "../controllers/admin.controller";

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

adminRoutes.post(
  "/cleanup/non-job-intake-records",
  requireRole("Owner"),
  requireAdminResetToken,
  cleanupNonJobIntake
);

adminRoutes.post(
  "/recalculate/jobs-count",
  requireRole("Owner"),
  requireAdminResetToken,
  recalculateJobsCount
);

adminRoutes.post(
  "/cleanup/test-jobs",
  requireRole("Owner"),
  requireAdminResetToken,
  cleanupTestJobsHandler
);
