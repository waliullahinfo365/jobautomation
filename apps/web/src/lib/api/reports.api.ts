import type { ReportHistoryRecord } from "@/types/report";
import { apiFetch, withQuery } from "./client";

export function listReports(params?: Record<string, unknown>) { return apiFetch<ReportHistoryRecord[]>(withQuery("/reports", params as any)); }
export function getReport(id: string) { return apiFetch(`/reports/${id}`); }
export function generateReport(payload?: Record<string, unknown>) { return apiFetch("/reports/generate", { method: "POST", body: payload ?? {} }); }
export function runDailyDigest(payload?: Record<string, unknown>) { return apiFetch("/reports/daily-digest/run", { method: "POST", body: payload ?? {} }); }
export function previewDailyDigest(payload?: Record<string, unknown>) { return apiFetch("/reports/daily-digest/preview", { method: "POST", body: payload ?? {} }); }
export function sendDailyDigestTest(payload?: Record<string, unknown>) { return apiFetch("/reports/daily-digest/test", { method: "POST", body: payload ?? {} }); }
export function runWeeklyReport(payload?: Record<string, unknown>) { return apiFetch("/reports/weekly/run", { method: "POST", body: payload ?? {} }); }
export function previewWeeklyReport(payload?: Record<string, unknown>) { return apiFetch("/reports/weekly/preview", { method: "POST", body: payload ?? {} }); }
export function sendWeeklyReportTest(payload?: Record<string, unknown>) { return apiFetch("/reports/weekly/test", { method: "POST", body: payload ?? {} }); }
export function queuePdfExport(payload: { documentId: string }) { return apiFetch("/reports/pdf-export", { method: "POST", body: payload }); }
export function sendReportTest(id: string, payload?: Record<string, unknown>) { return apiFetch(`/reports/${id}/send-test`, { method: "POST", body: payload ?? {} }); }
export function getReportStats() { return apiFetch("/reports/stats"); }
export function getDailyAnalytics(params?: Record<string, unknown>) { return apiFetch(withQuery("/reports/analytics/daily", params as any)); }
export function getWeeklyAnalytics(params?: Record<string, unknown>) { return apiFetch(withQuery("/reports/analytics/weekly", params as any)); }
