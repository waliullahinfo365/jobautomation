import { Router } from "express";
import {
  createReport,
  getDailyAnalytics,
  getReportById,
  getReportStats,
  getWeeklyAnalytics,
  listReports,
  runDailyDigest,
  runWeeklyReport,
  sendTestReport,
  updateReport,
} from "../controllers/report.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import { idParamSchema, listQuerySchema } from "../validators/common.validator";
import {
  dailyDigestRunBodySchema,
  reportAnalyticsQuerySchema,
  reportCreateSchema,
  reportSendTestBodySchema,
  reportUpdateSchema,
  weeklyReportRunBodySchema,
} from "../validators/report.validator";

export const reportRoutes = Router();

reportRoutes.get("/", requirePermission("reports.read"), validateQuery(listQuerySchema), listReports);
reportRoutes.post("/", requirePermission("reports.generate"), validateBody(reportCreateSchema), createReport);
reportRoutes.get("/stats", requirePermission("reports.read"), getReportStats);
reportRoutes.get("/analytics/daily", requirePermission("reports.read"), validateQuery(reportAnalyticsQuerySchema), getDailyAnalytics);
reportRoutes.get("/analytics/weekly", requirePermission("reports.read"), validateQuery(reportAnalyticsQuerySchema), getWeeklyAnalytics);
reportRoutes.post("/daily-digest/run", requirePermission("reports.generate"), validateBody(dailyDigestRunBodySchema), runDailyDigest);
reportRoutes.post("/weekly/run", requirePermission("reports.generate"), validateBody(weeklyReportRunBodySchema), runWeeklyReport);
reportRoutes.get("/:id", requirePermission("reports.read"), validateParams(idParamSchema), getReportById);
reportRoutes.patch(
  "/:id",
  requirePermission("reports.generate"),
  validateParams(idParamSchema),
  validateBody(reportUpdateSchema),
  updateReport
);
reportRoutes.post(
  "/:id/send-test",
  requirePermission("reports.generate"),
  validateParams(idParamSchema),
  validateBody(reportSendTestBodySchema),
  sendTestReport
);
