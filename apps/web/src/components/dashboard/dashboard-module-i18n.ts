import type { AutomationCategory } from "@/types/automation";

/** Maps automationModules mock/API `id` to `dashboard.modules.<key>` in translations. */
export const DASHBOARD_MODULE_ID_TO_KEY: Record<string, string> = {
  "job-intake-engine": "jobIntake",
  "duplicate-protection-engine": "duplicateProtection",
  "folder-subfolder-automation": "googleDriveFolders",
  "applied-status-automation": "appliedStatus",
  "interview-scheduling-automation": "interviewScheduling",
  "cv-file-routing-automation": "cvRouting",
  "email-reply-detection": "replyDetection",
  "follow-up-reminder-engine": "followUpRemindersModule",
  "document-pdf-export-automation": "pdfExport",
  "research-stage-document-generation": "researchDocument",
  "ai-processing-engine": "aiProcessing",
  "network-follow-up-automation": "networkFollowUp",
  "offer-tracking-automation": "offerTracking",
  "deadline-alert-system": "deadlineAlerts",
  "lifecycle-monitoring": "lifecycleMonitoring",
  "daily-status-digest": "dailyDigest",
  "weekly-performance-report": "weeklyReport",
};

const CATEGORY_TO_DASHBOARD_KEY: Record<AutomationCategory, string> = {
  Intake: "categoryIntake",
  Pipeline: "categoryPipeline",
  Documents: "categoryDocuments",
  Communication: "categoryCommunication",
  "AI Processing": "categoryAiProcessing",
  Reporting: "categoryReporting",
  Monitoring: "categoryMonitoring",
};

export function dashboardAutomationCategoryLabelKey(category: AutomationCategory): string {
  return `dashboard.automationHealth.${CATEGORY_TO_DASHBOARD_KEY[category]}`;
}
