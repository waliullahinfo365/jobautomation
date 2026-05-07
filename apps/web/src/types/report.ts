export type ReportTab = "Overview" | "Daily Digest" | "Weekly Report" | "PDF Exports" | "Report History";

export type ReportType = "Daily Digest" | "Weekly Performance" | "PDF Export" | "Manual Report";

export type ReportStatus = "Sent" | "Generated" | "Failed" | "Scheduled";

export type PDFExportStatus = "Pending" | "Exported" | "Failed" | "Needs Review" | "Preview Only";

export type PDFExportType = "Cover Letter" | "CV" | "Research Document" | "Weekly Report" | "Daily Digest";

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ReportStats {
  reportsGenerated: number;
  dailyDigestsSent: number;
  weeklyReportsSent: number;
  pdfExports: number;
  successRate: number;
  lastReport: string;
}

export interface DailyDigestData {
  date: string;
  newJobsDetected: number;
  applicationsSent: number;
  followUpsDue: number;
  repliesReceived: number;
  interviewsScheduled: number;
  deadlinesApproaching: number;
  failedAutomations: number;
  recommendedActions: string[];
  deliveryStatus: ReportStatus;
  recipientEmail: string;
  lastSentTime: string;
  nextScheduledTime: string;
}

export interface WeeklyReportData {
  weekRange: string;
  totalJobsFound: number;
  applicationsSubmitted: number;
  responseRate: number;
  interviewConversionRate: number;
  offersReceived: number;
  topSources: { source: string; count: number }[];
  bestPerformingCategories: string[];
  bottlenecks: string[];
  nextWeekFocus: string[];
  applicationsBySource: { source: string; count: number }[];
  responseRateTrend: { day: string; rate: number }[];
  pipelineConversion: { stage: string; conversion: number }[];
}

export interface PDFExportRecord {
  id: string;
  documentName: string;
  relatedJob: string;
  type: PDFExportType;
  exportStatus: PDFExportStatus;
  createdAt: string;
  /** Public HTTPS Drive/Docs (or API) URL only; empty when unavailable */
  exportPublicUrl: string;
  /** True when text/metadata preview should open instead of a file URL */
  textPreviewAvailable: boolean;
  documentId?: string;
  reportId?: string;
  /** Same as exportPublicUrl; kept for older callers */
  pdfLink: string;
}

export interface ReportHistoryRecord {
  id: string;
  reportName: string;
  type: ReportType;
  status: ReportStatus;
  generatedAt: string;
  sentTo: string;
  deliveryMethod: string;
  summaryText?: string;
  /** Backend delivery tracking */
  deliveryStatus?: string;
  /** From persisted report data (e.g. Delivered / Delivery warning / Not delivered) */
  deliveryOutcome?: string;
  /** True when last send attempt stored preview-only outcome */
  previewOnly?: boolean;
  pdfUrl?: string;
  googleDocUrl?: string;
  /** True when digest/report body saved but external Google delivery failed or fell back. */
  deliveryWarning?: boolean;
  deliveryWarningSummary?: string;
}

// Compatibility aliases for older components
export interface DailyDigestReport {
  _id: string;
  date: Date | string;
  totalJobs: number;
  activeJobs: number;
  newToday: number;
  appliedToday: number;
  interviewsThisWeek: number;
  pendingFollowUps: number;
  overdueDeadlines: number;
  automationErrors: number;
  highlights: string[];
  sentAt?: Date | string;
  createdAt: Date | string;
}

export interface WeeklyPerformanceReport {
  _id: string;
  weekStart: Date | string;
  weekEnd: Date | string;
  jobsAdded: number;
  applicationsSubmitted: number;
  interviewsScheduled: number;
  offersReceived: number;
  rejections: number;
  responseRate: number;
  averageTimeToApply: number;
  topSources: { source: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  sentAt?: Date | string;
  createdAt: Date | string;
}
