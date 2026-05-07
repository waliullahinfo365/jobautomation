import { Router } from "express";
import {
  createReport,
  generateReport,
  getDailyAnalytics,
  getReportById,
  getReportStats,
  getSummary,
  getWeeklyAnalytics,
  listReports,
  previewDailyDigest,
  previewWeeklyReport,
  queuePdfExportFromReports,
  runDailyDigest,
  runWeeklyReport,
  sendDailyDigestTest,
  sendTestReport,
  sendWeeklyReportTest,
  updateReport,
} from "../controllers/report.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import { idParamSchema, listQuerySchema } from "../validators/common.validator";
import {
  dailyDigestRunBodySchema,
  reportPdfExportBodySchema,
  reportAnalyticsQuerySchema,
  reportCreateSchema,
  reportsGenerateBodySchema,
  reportSendTestBodySchema,
  reportUpdateSchema,
  weeklyReportRunBodySchema,
} from "../validators/report.validator";

export const reportRoutes = Router();

reportRoutes.get("/", requirePermission("reports.read"), validateQuery(listQuerySchema), listReports);
reportRoutes.post("/", requirePermission("reports.generate"), validateBody(reportCreateSchema), createReport);
reportRoutes.get("/stats", requirePermission("reports.read"), getReportStats);
reportRoutes.get("/summary", requirePermission("reports.read"), getSummary);
reportRoutes.get("/analytics/daily", requirePermission("reports.read"), validateQuery(reportAnalyticsQuerySchema), getDailyAnalytics);
reportRoutes.get("/analytics/weekly", requirePermission("reports.read"), validateQuery(reportAnalyticsQuerySchema), getWeeklyAnalytics);
reportRoutes.post("/generate", requirePermission("reports.generate"), validateBody(reportsGenerateBodySchema), generateReport);
reportRoutes.post("/daily-digest/run", requirePermission("reports.generate"), validateBody(dailyDigestRunBodySchema), runDailyDigest);
reportRoutes.post("/daily-digest/preview", requirePermission("reports.read"), previewDailyDigest);
reportRoutes.post("/daily-digest/test", requirePermission("reports.generate"), validateBody(reportSendTestBodySchema), sendDailyDigestTest);
reportRoutes.post("/weekly/run", requirePermission("reports.generate"), validateBody(weeklyReportRunBodySchema), runWeeklyReport);
reportRoutes.post("/weekly/preview", requirePermission("reports.read"), previewWeeklyReport);
reportRoutes.post("/weekly/test", requirePermission("reports.generate"), validateBody(reportSendTestBodySchema), sendWeeklyReportTest);
reportRoutes.post("/pdf-export", requirePermission("reports.generate"), validateBody(reportPdfExportBodySchema), queuePdfExportFromReports);
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
