import type { reportStatuses, reportTypes } from "../constants/statuses";
export type ReportType = (typeof reportTypes)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type ReportDeliveryStatus = "Not Sent" | "Queued" | "Sent" | "Failed";
export type ReportPeriodType = "daily" | "weekly" | "manual";
export interface Report { id: string; tenantId: string; createdBy: string; type: ReportType; status: ReportStatus; name: string; generatedAt?: string; sentAt?: string; sentTo?: string[]; deliveryMethod?: string; pdfUrl?: string; data?: Record<string, unknown>; errorMessage?: string; periodKey?: string; periodStart?: string; periodEnd?: string; deliveryStatus?: ReportDeliveryStatus; deliveryError?: string; deliveryId?: string; summaryText?: string; metrics?: Record<string, unknown>; recommendations?: string[]; generatedBy?: string; idempotencyKey?: string; createdAt: string; updatedAt: string; }

export interface DailyDigestMetrics {
  date: string;
  newJobs: number;
  applicationsSent: number;
  followUpsDue: number;
  repliesReceived: number;
  interviewsScheduled: number;
  offersReceived: number;
  deadlinesApproaching: number;
  failedAutomations: number;
}

export interface WeeklyPerformanceMetrics {
  weekStart: string;
  weekEnd: string;
  totalJobsFound: number;
  applicationsSubmitted: number;
  repliesReceived: number;
  responseRate: number;
  interviewsScheduled: number;
  interviewConversionRate: number;
  offersReceived: number;
  offerRate: number;
  rejections: number;
  topSources: Array<{ source: string; count: number }>;
  pipelineBreakdown: {
    applications: Record<string, number>;
    jobs: Record<string, number>;
  };
  recommendations: string[];
}

export interface ReportGenerationResult {
  operationId: string;
  tenantId: string;
  reportId: string;
  type: ReportType;
  status: ReportStatus;
  periodKey: string;
  metrics: DailyDigestMetrics | WeeklyPerformanceMetrics;
  summaryText: string;
  deliveryStatus: ReportDeliveryStatus;
}

export interface ReportDeliveryResult {
  operationId: string;
  tenantId: string;
  reportId: string;
  deliveryStatus: ReportDeliveryStatus;
  deliveryId?: string;
  message: string;
}
