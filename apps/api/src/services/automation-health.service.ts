import {
  AutomationLogModel,
  AutomationModuleModel,
  DocumentModel,
  IntegrationConnectionModel,
  LifecycleInsightModel,
} from "@jobflow/database/models";
import {
  GOOGLE_DOCUMENTS_SCOPE,
  GOOGLE_DRIVE_FILE_SCOPE,
  missingGoogleScopes,
} from "@jobflow/shared/constants/googleScopes";

type HealthStatus = "ready" | "not_run_yet" | "healthy" | "warning" | "failed" | "needs_setup";
type LogStatus = "Success" | "Warning" | "Failed" | "Running";

const MODULE_DEFS = [
  ["job-intake", "Job intake & parsing", "Jobs", "Normalize inbound alerts into structured job records."],
  ["duplicate-protection", "Duplicate protection", "Jobs", "Fingerprint and block duplicate listings automatically."],
  ["folder-automation", "Google Drive folders", "Documents", "Provision per-job folders in Drive for application assets."],
  ["job-apply", "Auto-apply", "Applications", "Automate job applications via LinkedIn Easy Apply and other platforms."],
  ["applied-status", "Applied status", "Applications", "Track application send and applied automation health."],
  ["interview-scheduling", "Interview scheduling", "Interviews", "Create calendar events and prep tasks for interviews."],
  ["cv-routing", "CV routing", "Documents", "Route CV artifacts into the correct Drive folders."],
  ["email-reply-detection", "Reply detection", "Applications", "Classify recruiter replies and update pipeline stages."],
  ["follow-up-reminder", "Follow-up reminders", "Applications", "Schedule nudges when follow-ups are due."],
  ["pdf-export", "PDF export", "Documents", "Export research and cover letters as PDF or Google Docs."],
  ["research-document", "Research document", "Documents", "Generate company and role research briefs with AI."],
  ["ai-processing", "AI processing", "System", "End-to-end AI pipeline for parsing and summarization."],
  ["network-follow-up", "Network follow-up", "Contacts", "Remind you to follow up on warm networking contacts."],
  ["offer-tracking", "Offer tracking", "Applications", "Track offer stages, deadlines, and next actions."],
  ["deadline-alert", "Deadline alerts", "Jobs", "Surface roles with upcoming close dates."],
  ["lifecycle-monitoring", "Lifecycle monitoring", "System", "Watch long-running application lifecycles for drift."],
  ["daily-digest", "Daily digest", "Reports", "Send a daily summary of progress and follow-ups."],
  ["weekly-report", "Weekly report", "Reports", "Generate weekly performance and pipeline analytics."],
] as const;

const REQUIRED: Record<string, string[]> = {
  "job-apply": ["ai_provider"],
  "job-intake": ["gmail", "ai_provider"],
  "email-reply-detection": ["gmail", "ai_provider"],
  "folder-automation": ["google_drive"],
  "cv-routing": ["google_drive", "active_cv"],
  "research-document": ["ai_provider", "google_drive_docs"],
  "ai-processing": ["ai_provider"],
  "pdf-export": ["google_drive_docs"],
  "daily-digest": ["notification_channel"],
  "weekly-report": ["notification_channel"],
  "interview-scheduling": ["google_calendar"],
  "deadline-alert": ["dashboard_notifications"],
  "follow-up-reminder": ["notification_channel"],
  "offer-tracking": ["gmail", "ai_provider"],
};

function providerConnected(rows: Map<string, any>, provider: string) {
  const row = rows.get(provider);
  return row?.status === "Connected";
}

function googleReady(rows: Map<string, any>, provider: string, scopes: readonly string[]) {
  const row = rows.get(provider);
  if (row?.status !== "Connected") return false;
  return missingGoogleScopes(row.scopes ?? [], scopes).length === 0;
}

function notificationReady(rows: Map<string, any>) {
  return (
    providerConnected(rows, "Telegram") ||
    providerConnected(rows, "Slack") ||
    providerConnected(rows, "Resend") ||
    providerConnected(rows, "SMTP") ||
    (Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) && Boolean(process.env.TELEGRAM_CHAT_ID?.trim())) ||
    Boolean(process.env.SLACK_WEBHOOK_URL?.trim()) ||
    (Boolean(process.env.RESEND_API_KEY?.trim()) && Boolean(process.env.RESEND_FROM_EMAIL?.trim())) ||
    (Boolean(process.env.SMTP_HOST?.trim()) && Boolean(process.env.SMTP_USER?.trim()) && Boolean(process.env.SMTP_PASS?.trim()))
  );
}

function requirementLabel(key: string) {
  const labels: Record<string, string> = {
    gmail: "Gmail",
    ai_provider: "Anthropic Claude",
    google_drive: "Google Drive",
    google_drive_docs: "Google Drive and Google Docs scope",
    google_calendar: "Google Calendar",
    active_cv: "Active CV / resume",
    notification_channel: "Telegram, Slack, Resend, SMTP, or dashboard notifications",
    dashboard_notifications: "Dashboard notifications",
  };
  return labels[key] ?? key;
}

function requirementSatisfied(key: string, rows: Map<string, any>, activeCvCount: number) {
  switch (key) {
    case "gmail":
      return googleReady(rows, "Gmail", [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
      ]);
    case "ai_provider":
      return providerConnected(rows, "Claude");
    case "google_drive":
      return googleReady(rows, "Google Drive", [GOOGLE_DRIVE_FILE_SCOPE]);
    case "google_drive_docs":
      return googleReady(rows, "Google Drive", [GOOGLE_DRIVE_FILE_SCOPE, GOOGLE_DOCUMENTS_SCOPE]);
    case "google_calendar":
      return googleReady(rows, "Google Calendar", ["https://www.googleapis.com/auth/calendar.events"]);
    case "active_cv":
      return activeCvCount > 0;
    case "notification_channel":
      return notificationReady(rows);
    case "dashboard_notifications":
      return true;
    default:
      return false;
  }
}

function calculateStatus(input: {
  totalRuns: number;
  missingRequirements: string[];
  latestStatus: LogStatus | null;
}): HealthStatus {
  if (input.missingRequirements.length > 0) return "needs_setup";
  if (input.totalRuns === 0) return "not_run_yet";
  if (input.latestStatus === "Failed") return "failed";
  if (input.latestStatus === "Warning" || input.latestStatus === "Running") return "warning";
  return "healthy";
}

function recommendedNextStep(status: HealthStatus, missingRequirements: string[]) {
  if (status === "needs_setup") return `Connect or configure: ${missingRequirements.join(", ")}.`;
  if (status === "not_run_yet") return "Run this automation once to see health metrics.";
  if (status === "failed") return "Open the latest failed log and rerun after fixing the error.";
  if (status === "warning") return "Review recent warnings and confirm optional delivery/configuration.";
  return "No action needed. Recent automation runs are successful.";
}

export async function getLifecycleInsights(tenantId: string, options?: {
  status?: "open" | "resolved";
  severity?: string;
  limit?: number;
}) {
  const filter: Record<string, unknown> = { tenantId };
  if (options?.status) filter.status = options.status;
  if (options?.severity) filter.severity = options.severity;
  return LifecycleInsightModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(options?.limit ?? 50)
    .lean();
}

export async function getAutomationModuleHealth(tenantId: string) {
  const [modules, logs, integrations, activeCvCount, activeTemplateCount, openInsights] = await Promise.all([
    AutomationModuleModel.find({ tenantId }).lean(),
    AutomationLogModel.find({ tenantId }).sort({ createdAt: -1 }).limit(500).lean(),
    IntegrationConnectionModel.find({ tenantId }).lean(),
    DocumentModel.countDocuments({
      tenantId,
      isActiveProfileDocument: true,
      profileDocumentType: "cv_resume",
    }),
    DocumentModel.countDocuments({
      tenantId,
      isActiveProfileDocument: true,
      profileDocumentType: "cover_letter_template",
    }),
    LifecycleInsightModel.find({ tenantId, status: "open" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const moduleRows = new Map(modules.map((row: any) => [String(row.moduleKey), row]));
  const integrationRows = new Map(integrations.map((row: any) => [String(row.provider), row]));
  const logsByModule = new Map<string, any[]>();
  for (const log of logs as any[]) {
    const key = String(log.moduleKey ?? "");
    if (!key) continue;
    const list = logsByModule.get(key) ?? [];
    list.push(log);
    logsByModule.set(key, list);
  }

  const readiness = {
    gmailConnected: requirementSatisfied("gmail", integrationRows, activeCvCount),
    driveConnected: requirementSatisfied("google_drive", integrationRows, activeCvCount),
    calendarConnected: requirementSatisfied("google_calendar", integrationRows, activeCvCount),
    aiProviderConnected: requirementSatisfied("ai_provider", integrationRows, activeCvCount),
    notificationChannelConnected: requirementSatisfied("notification_channel", integrationRows, activeCvCount),
    cvUploaded: activeCvCount > 0,
    coverLetterTemplateUploaded: activeTemplateCount > 0,
  };

  const data = MODULE_DEFS.map(([key, fallbackName, fallbackCategory, fallbackDescription]) => {
    const row = moduleRows.get(key) as any;
    const moduleLogs = logsByModule.get(key) ?? [];
    const successRuns = moduleLogs.filter((log) => log.status === "Success").length;
    const failedRuns = moduleLogs.filter((log) => log.status === "Failed").length;
    const warningRuns = moduleLogs.filter((log) => log.status === "Warning").length;
    const completedRuns = successRuns + failedRuns + warningRuns;
    const durations = moduleLogs
      .map((log) => Number(log.durationMs))
      .filter((value) => Number.isFinite(value) && value > 0);
    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : null;
    const last = moduleLogs[0] ?? null;
    const requirementKeys = REQUIRED[key] ?? [];
    const missingRequirements = requirementKeys
      .filter((requirement) => !requirementSatisfied(requirement, integrationRows, activeCvCount))
      .map(requirementLabel);
    const status = calculateStatus({
      totalRuns: completedRuns,
      missingRequirements,
      latestStatus: (last?.status as LogStatus | undefined) ?? null,
    });

    return {
      id: key,
      key,
      moduleKey: key,
      name: row?.name ?? fallbackName,
      description: row?.description ?? fallbackDescription,
      category: row?.category ?? fallbackCategory,
      status,
      enabled: row?.enabled !== false,
      totalRuns: completedRuns,
      successRuns,
      failedRuns,
      warningRuns,
      successRate: completedRuns > 0 ? Math.round((successRuns / completedRuns) * 100) : null,
      avgDurationMs,
      averageDurationMs: avgDurationMs,
      lastRunAt: last?.createdAt ?? null,
      lastRunStatus: last?.status ?? null,
      lastMessage: last?.message ?? null,
      lastError: last?.error ?? null,
      requiredIntegrations: requirementKeys.map(requirementLabel),
      missingRequirements,
      recommendedNextStep: recommendedNextStep(status, missingRequirements),
      readiness,
      actions: {
        canRunTest: true,
        canConfigure: true,
        canViewDetails: true,
      },
      recentLogs: moduleLogs.slice(0, 10),
      triggerType: row?.triggerType ?? "Scheduled / manual",
      triggerSource: row?.triggerSource ?? "Automation worker",
      schedule: row?.schedule ?? "",
      configuration: row?.configuration ?? {},
    };
  });

  const insightSummary = {
    total: openInsights.length,
    critical: (openInsights as any[]).filter((i) => i.severity === "critical").length,
    warning: (openInsights as any[]).filter((i) => i.severity === "warning").length,
    info: (openInsights as any[]).filter((i) => i.severity === "info").length,
    items: (openInsights as any[]).slice(0, 20).map((i) => ({
      id: String(i._id),
      recordType: i.recordType,
      recordId: i.recordId,
      severity: i.severity,
      issueType: i.issueType,
      message: i.message,
      recommendedAction: i.recommendedAction,
      createdAt: i.createdAt,
    })),
  };

  return { modules: data, pipelineInsights: insightSummary, readiness };
}
