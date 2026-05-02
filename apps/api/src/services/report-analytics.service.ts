import { ApplicationModel, AutomationLogModel, InterviewModel, JobModel, ReportModel } from "@jobflow/database/models";
import type { DailyDigestMetrics, WeeklyPerformanceMetrics } from "@jobflow/shared/types/report";
import { assertTenantId } from "./baseTenant.service";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function deterministicRecommendations(metrics: WeeklyPerformanceMetrics): string[] {
  const recommendations: string[] = [];
  if (metrics.applicationsSubmitted === 0) recommendations.push("Increase application volume this week to improve pipeline momentum.");
  if (metrics.responseRate < 0.15) recommendations.push("Improve CV/cover letter tailoring to raise reply rate.");
  if (metrics.interviewConversionRate < 0.1) recommendations.push("Refine screening alignment and follow-up timing for better interview conversion.");
  if (metrics.offerRate < 0.05 && metrics.interviewsScheduled > 0) recommendations.push("Review interview prep process to improve offer conversion.");
  if (!recommendations.length) recommendations.push("Pipeline metrics look healthy; keep current cadence and iterate on top-performing sources.");
  return recommendations;
}

export async function getDailyDigestMetrics(input: { tenantId: string; date: Date }): Promise<DailyDigestMetrics> {
  const tenantId = assertTenantId(input.tenantId);
  const dayStart = startOfDay(input.date);
  const dayEnd = endOfDay(input.date);
  const deadlineEnd = new Date(dayEnd);
  deadlineEnd.setDate(deadlineEnd.getDate() + 2);

  const [newJobs, applicationsSent, followUpsDue, repliesReceived, interviewsScheduled, offersReceived, deadlinesApproaching, failedAutomations] =
    await Promise.all([
      JobModel.countDocuments({
        tenantId,
        $or: [{ dateFound: { $gte: dayStart, $lte: dayEnd } }, { createdAt: { $gte: dayStart, $lte: dayEnd } }],
      }),
      ApplicationModel.countDocuments({ tenantId, dateApplied: { $gte: dayStart, $lte: dayEnd } }),
      ApplicationModel.countDocuments({
        tenantId,
        followUpDate: { $lte: dayEnd },
        followUpStatus: { $ne: "Sent" },
      }),
      ApplicationModel.countDocuments({
        tenantId,
        $or: [
          { replyDetectedAt: { $gte: dayStart, $lte: dayEnd } },
          { responseDetected: true, updatedAt: { $gte: dayStart, $lte: dayEnd } },
        ],
      }),
      InterviewModel.countDocuments({
        tenantId,
        $or: [{ dateTime: { $gte: dayStart, $lte: dayEnd } }, { createdAt: { $gte: dayStart, $lte: dayEnd } }],
      }),
      ApplicationModel.countDocuments({
        tenantId,
        applicationStatus: "Offer",
        updatedAt: { $gte: dayStart, $lte: dayEnd },
      }),
      JobModel.countDocuments({ tenantId, deadline: { $gte: dayStart, $lte: deadlineEnd } }),
      AutomationLogModel.countDocuments({ tenantId, status: "Failed", createdAt: { $gte: dayStart, $lte: dayEnd } }),
    ]);

  return {
    date: dayStart.toISOString().slice(0, 10),
    newJobs,
    applicationsSent,
    followUpsDue,
    repliesReceived,
    interviewsScheduled,
    offersReceived,
    deadlinesApproaching,
    failedAutomations,
  };
}

export async function getWeeklyPerformanceMetrics(input: {
  tenantId: string;
  weekStart: Date;
  weekEnd: Date;
}): Promise<WeeklyPerformanceMetrics> {
  const tenantId = assertTenantId(input.tenantId);
  const weekStart = startOfDay(input.weekStart);
  const weekEnd = endOfDay(input.weekEnd);

  const [totalJobsFound, applicationsSubmitted, repliesReceived, interviewsScheduled, offersReceived, rejections, topSourcesRaw, applicationBreakdown, jobBreakdown] =
    await Promise.all([
      JobModel.countDocuments({
        tenantId,
        $or: [{ dateFound: { $gte: weekStart, $lte: weekEnd } }, { createdAt: { $gte: weekStart, $lte: weekEnd } }],
      }),
      ApplicationModel.countDocuments({ tenantId, dateApplied: { $gte: weekStart, $lte: weekEnd } }),
      ApplicationModel.countDocuments({
        tenantId,
        $or: [
          { replyDetectedAt: { $gte: weekStart, $lte: weekEnd } },
          { responseDetected: true, updatedAt: { $gte: weekStart, $lte: weekEnd } },
        ],
      }),
      InterviewModel.countDocuments({ tenantId, dateTime: { $gte: weekStart, $lte: weekEnd } }),
      ApplicationModel.countDocuments({ tenantId, applicationStatus: "Offer", updatedAt: { $gte: weekStart, $lte: weekEnd } }),
      ApplicationModel.countDocuments({ tenantId, applicationStatus: "Rejected", updatedAt: { $gte: weekStart, $lte: weekEnd } }),
      JobModel.aggregate([
        { $match: { tenantId, createdAt: { $gte: weekStart, $lte: weekEnd } } },
        { $group: { _id: { $ifNull: ["$source", "Unknown"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      ApplicationModel.aggregate([
        { $match: { tenantId } },
        { $group: { _id: "$applicationStatus", count: { $sum: 1 } } },
      ]),
      JobModel.aggregate([{ $match: { tenantId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

  const responseRate = applicationsSubmitted > 0 ? Number((repliesReceived / applicationsSubmitted).toFixed(3)) : 0;
  const interviewConversionRate = applicationsSubmitted > 0 ? Number((interviewsScheduled / applicationsSubmitted).toFixed(3)) : 0;
  const offerRate = applicationsSubmitted > 0 ? Number((offersReceived / applicationsSubmitted).toFixed(3)) : 0;

  const metrics: WeeklyPerformanceMetrics = {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    totalJobsFound,
    applicationsSubmitted,
    repliesReceived,
    responseRate,
    interviewsScheduled,
    interviewConversionRate,
    offersReceived,
    offerRate,
    rejections,
    topSources: topSourcesRaw.map((row) => ({ source: String(row._id), count: Number(row.count) })),
    pipelineBreakdown: {
      applications: Object.fromEntries(applicationBreakdown.map((row) => [String(row._id), Number(row.count)])),
      jobs: Object.fromEntries(jobBreakdown.map((row) => [String(row._id), Number(row.count)])),
    },
    recommendations: [],
  };
  metrics.recommendations = deterministicRecommendations(metrics);
  return metrics;
}

export async function getReportHistoryStats(input: { tenantId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const [totalReports, sentReports, failedReports, latestReports] = await Promise.all([
    ReportModel.countDocuments({ tenantId }),
    ReportModel.countDocuments({ tenantId, deliveryStatus: "Sent" }),
    ReportModel.countDocuments({ tenantId, $or: [{ status: "Failed" }, { deliveryStatus: "Failed" }] }),
    ReportModel.find({ tenantId }).sort({ generatedAt: -1 }).limit(5).select("_id type status deliveryStatus generatedAt periodKey"),
  ]);

  return {
    totalReports,
    sentReports,
    failedReports,
    latestReports: latestReports.map((report) => ({
      id: String(report._id),
      type: report.type,
      status: report.status,
      deliveryStatus: report.deliveryStatus,
      generatedAt: report.generatedAt,
      periodKey: report.periodKey,
    })),
  };
}
