import { USE_MOCK_FALLBACK } from "@/config/env";
import { automationModules } from "@/data/automationModules";
import { mockApplications } from "@/data/mockApplications";
import { mockContacts } from "@/data/mockContacts";
import { mockDocumentRecords } from "@/data/mockDocuments";
import { mockInterviews } from "@/data/mockInterviews";
import { mockJobs } from "@/data/mockJobs";
import {
  mockActivityFeed,
  mockDailyDigest,
  mockDailyDigestPreview,
  mockReportHistory,
  mockReportStats,
  mockWeeklyReport,
  mockWeeklyReportPreview,
} from "@/data/mockReports";
import { mockBillingSettings, mockIntegrationListItems, mockIntegrationsHealth, mockResendIntegrationStatus } from "@/data/mockSettings";
import type { AutomationLog } from "@/types/automation";
import { ApiError } from "./client";

const mockAutomationLogs: AutomationLog[] = mockActivityFeed.map((item, index) => ({
  id: item.id,
  _id: item.id,
  moduleId: `module_${index + 1}`,
  moduleName: item.event,
  status: item.severity === "warning" ? "Warning" : "Success",
  message: item.detail,
  relatedRecord: `activity_${index + 1}`,
  duration: `${80 + index * 25}ms`,
  createdAt: item.timestamp,
}));

export function shouldUseMockFallback(error?: unknown): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (!USE_MOCK_FALLBACK) return false;
  if (!error) return true;
  if (error instanceof ApiError) return error.isNetworkError || error.status >= 500 || error.status === 0;
  return true;
}

export function getMockFallback(resourceName: string): unknown {
  switch (resourceName) {
    case "jobs":
      return mockJobs;
    case "applications":
      return mockApplications;
    case "contacts":
      return mockContacts;
    case "interviews":
      return mockInterviews;
    case "documents":
      return mockDocumentRecords;
    case "reportHistory":
      return mockReportHistory;
    case "reportStats":
      return mockReportStats;
    case "reportDailyAnalytics":
      return mockDailyDigestPreview;
    case "reportWeeklyAnalytics":
      return mockWeeklyReportPreview;
    /** @deprecated use granular report* keys */
    case "reports":
      return { daily: mockDailyDigest, weekly: mockWeeklyReport, stats: mockReportStats };
    case "automationModules":
      return automationModules;
    case "automationLogs":
      return mockAutomationLogs;
    case "billing":
      return {
        currentPlan: mockBillingSettings.currentPlan,
        usage: mockBillingSettings,
        billingStatus: "Trialing",
        limits: {},
        usagePercentages: {},
      };
    case "integrations":
      return mockIntegrationListItems;
    case "integrationsHealth":
      return mockIntegrationsHealth;
    case "resendIntegrationStatus":
      return mockResendIntegrationStatus;
    default:
      return null;
  }
}
