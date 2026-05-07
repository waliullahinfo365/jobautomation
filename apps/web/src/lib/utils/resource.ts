import type { Job, JobDocument, JobTimelineEvent, JobAutomationLog } from "@/types/job";
import type { Application } from "@/types/application";
import type { Contact, ContactAutomationLog, ContactCommunicationEvent, ContactRelatedJob } from "@/types/contact";
import type { DocumentRecord, DocumentStatus, DocumentType, PDFExportStatus } from "@/types/document";
import type {
  Interview,
  InterviewAutomationLog,
  InterviewPrepChecklistItem,
  InterviewTimelineEvent,
} from "@/types/interview";
import type { DailyDigestData, ReportHistoryRecord, ReportStats, WeeklyReportData } from "@/types/report";
import type {
  AutomationAction,
  AutomationCategory,
  AutomationConfiguration,
  AutomationLog,
  AutomationModule,
  AutomationStatus,
} from "@/types/automation";
import { automationModules } from "@/data/automationModules";
import { API_URL } from "@/config/env";
import { isPublicFileUrl } from "@/lib/utils/is-public-file-url";

/** Maps dashboard mock module card ids to backend `moduleKey` values. */
const AUTOMATION_UI_ID_TO_BACKEND_KEY: Record<string, string> = {
  "job-intake-engine": "job-intake",
  "duplicate-protection-engine": "duplicate-protection",
  "folder-subfolder-automation": "folder-automation",
  "applied-status-automation": "applied-status",
  "interview-scheduling-automation": "interview-scheduling",
  "cv-file-routing-automation": "cv-routing",
  "follow-up-reminder-engine": "follow-up-reminder",
  "document-pdf-export-automation": "pdf-export",
  "research-stage-document-generation": "research-document",
  "ai-processing-engine": "ai-processing",
  "network-follow-up-automation": "network-follow-up",
  "offer-tracking-automation": "offer-tracking",
  "deadline-alert-system": "deadline-alert",
  "daily-status-digest": "daily-digest",
  "weekly-performance-report": "weekly-report",
};

/** Resolves a UI card id or backend key to the automation API `moduleKey`. */
export function resolveAutomationBackendModuleKey(uiOrBackendId: string): string {
  return AUTOMATION_UI_ID_TO_BACKEND_KEY[uiOrBackendId] ?? uiOrBackendId;
}

/** Overlays rich mock catalog visuals (icons, actions) onto API-shaped modules without losing live metrics. */
export function mergeAutomationModuleWithMockCatalog(module: AutomationModule): AutomationModule {
  const key = resolveAutomationBackendModuleKey(module.id);
  const mock = automationModules.find((m) => resolveAutomationBackendModuleKey(m.id) === key);
  if (!mock) return { ...module, recentLogs: module.recentLogs ?? [] };
  return {
    ...module,
    icon: mock.icon,
    actions: mock.actions?.length ? mock.actions : module.actions,
    description: module.description || mock.description,
    configuration:
      module.configuration?.connectedAccount === "Not connected" ? mock.configuration : module.configuration,
  };
}

/**
 * Returns the canonical ID for any resource that may use `id` or `_id`.
 */
export function getResourceId(item: { id?: string; _id?: string } | null | undefined): string {
  if (!item) return "";
  return item.id ?? item._id ?? "";
}

function mapDocumentTypeToJobCard(t: string, meta?: Record<string, unknown>): JobDocument["type"] {
  if (t === "CV" || t === "Cover Letter" || t === "Research" || t === "Final PDF") return t;
  if (meta?.documentCategory === "ai-analysis") return "Other";
  return "Other";
}

function mapDocumentRowStatus(status: string, generationStatus?: string): JobDocument["status"] {
  if (generationStatus === "Generated") {
    if (status === "Sent") return "Sent";
    return "Generated";
  }
  const allowed: JobDocument["status"][] = ["Draft", "Ready", "Generated", "Sent", "Archived"];
  return (allowed.includes(status as JobDocument["status"]) ? status : "Draft") as JobDocument["status"];
}

/** Maps a Mongo/API Document row (or mock row) into the job detail card shape. */
export function normalizeJobDocumentRow(raw: unknown): JobDocument {
  const d = (raw ?? {}) as Record<string, unknown>;
  const meta = (d.metadata && typeof d.metadata === "object" ? d.metadata : {}) as Record<string, unknown>;

  if (
    typeof d.fileName === "string" &&
    typeof d.type === "string" &&
    d.id &&
    !d._id &&
    d.contentText === undefined &&
    d.generationStatus === undefined
  ) {
    return {
      id: String(d.id),
      fileName: String(d.fileName),
      type: d.type as JobDocument["type"],
      status: (d.status as JobDocument["status"]) ?? "Draft",
      url: String(d.url ?? ""),
      createdAt: d.createdAt as string | undefined,
      documentKind: d.documentKind as string | undefined,
      contentPreview: d.contentPreview as string | undefined,
    };
  }

  const id = String(d._id ?? d.id ?? "");
  const contentText = typeof d.contentText === "string" ? d.contentText : "";
  const typeRaw = String(d.type ?? "Other");
  return {
    id,
    fileName: String(d.fileName ?? "Untitled"),
    type: mapDocumentTypeToJobCard(typeRaw, meta),
    status: mapDocumentRowStatus(String(d.status ?? "Draft"), String(d.generationStatus ?? "")),
    url:
      typeof d.storageUrl === "string" && d.storageUrl.length > 0
        ? d.storageUrl
        : typeof meta.googleDocUrl === "string"
          ? meta.googleDocUrl
          : "",
    createdAt:
      typeof d.createdAt === "string"
        ? d.createdAt
        : d.createdAt instanceof Date
          ? d.createdAt.toISOString()
          : undefined,
    documentKind: d.documentKind ? String(d.documentKind) : undefined,
    contentPreview: contentText ? contentText.slice(0, 280) : undefined,
    contentText: contentText || undefined,
    googleDocUrl: typeof meta.googleDocUrl === "string" ? meta.googleDocUrl : undefined,
  };
}

function mapAutomationLogBackendToJobActivityStatus(s: string): JobAutomationLog["status"] {
  const u = s.toLowerCase();
  if (u === "failed") return "error";
  if (u === "warning" || u === "running") return "warning";
  return "success";
}

function formatAutomationModuleLabel(key: string): string {
  return key
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Maps an AutomationLog row (or mock activity row) for the job detail sidebar. */
export function normalizeJobAutomationLogRow(raw: unknown): JobAutomationLog {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.event === "string" && typeof r.detail === "string" && typeof r.status === "string") {
    const statusLower = r.status.toLowerCase();
    const status: JobAutomationLog["status"] =
      statusLower === "error" || statusLower === "failed"
        ? "error"
        : statusLower === "warning"
          ? "warning"
          : "success";
    return {
      id: String(r.id ?? r._id ?? ""),
      event: r.event,
      detail: r.detail,
      timestamp: String(r.timestamp ?? new Date().toISOString()),
      status,
      raw: { ...r },
    };
  }

  const id = String(r._id ?? r.id ?? "");
  const moduleKey = String(r.moduleKey ?? r.moduleName ?? "automation");
  const message = String(r.message ?? "");
  const created =
    typeof r.createdAt === "string"
      ? r.createdAt
      : r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : new Date().toISOString();

  const err = r.error;
  return {
    id,
    event: formatAutomationModuleLabel(moduleKey),
    detail: message,
    timestamp: created,
    status: mapAutomationLogBackendToJobActivityStatus(String(r.status ?? "Success")),
    moduleKey,
    error: typeof err === "string" && err.length > 0 ? err : undefined,
    raw: { ...r },
  };
}

/**
 * Normalizes a raw backend Job (which uses _id, may alias fields differently)
 * to the frontend Job shape that components expect.
 */
export function normalizeJobForUi(raw: unknown): Job {
  const j = (raw ?? {}) as Record<string, unknown>;
  const id = ((j.id ?? j._id) as string) ?? "";
  const documentsRaw = j.documents;
  const automationRaw = j.automationLogs;

  const documents: JobDocument[] = Array.isArray(documentsRaw)
    ? (documentsRaw as unknown[]).map(normalizeJobDocumentRow)
    : [];

  const automationLogs: JobAutomationLog[] = Array.isArray(automationRaw)
    ? (automationRaw as unknown[]).map(normalizeJobAutomationLogRow)
    : [];

  return {
    id,
    _id: id,
    company: (j.company as string) ?? "",
    position: ((j.position ?? j.title) as string) ?? "",
    title: ((j.position ?? j.title) as string) ?? "",
    source: (j.source as Job["source"]) ?? "Manual",
    status: (j.status as Job["status"]) ?? "New",
    priority: (j.priority as Job["priority"]) ?? "Medium",
    location: (j.location as string) ?? "",
    remote: Boolean(j.remote),
    jobUrl: ((j.jobUrl ?? j.url) as string) ?? "",
    url: ((j.url ?? j.jobUrl) as string) ?? "",
    salaryRange: (j.salaryRange as string) ?? "",
    deadline: (j.deadline as string | undefined),
    dateFound: ((j.dateFound ?? j.createdAt) as string) ?? new Date().toISOString(),
    dateApplied: (j.dateApplied as string | undefined),
    lastUpdated: ((j.lastUpdated ?? j.updatedAt) as string) ?? new Date().toISOString(),
    createdAt: ((j.createdAt ?? j.dateFound) as string) ?? new Date().toISOString(),
    updatedAt: ((j.updatedAt ?? j.lastUpdated) as string) ?? new Date().toISOString(),
    contactEmail: (j.contactEmail as string | undefined),
    description: (j.description as string) ?? "",
    aiSummary: (j.aiSummary as string) ?? "",
    duplicateStatus: (j.duplicateStatus as Job["duplicateStatus"]) ?? "Skipped Duplicate",
    folderCreated: Boolean(j.folderCreated),
    driveFolderLink: (j.driveFolderLink as string) ?? (j.driveFolderUrl as string),
    researchFolderLink: (j.researchFolderLink as string | undefined),
    coverLetterFolderLink: (j.coverLetterFolderLink as string | undefined),
    cvFolderLink: (j.cvFolderLink as string | undefined),
    applicationProofFolderLink: (j.applicationProofFolderLink as string | undefined),
    interviewPrepFolderLink: (j.interviewPrepFolderLink as string | undefined),
    aiDraftDocUrl: (j.aiDraftDocUrl as string | undefined),
    documents,
    timeline: ((j.timeline ?? []) as JobTimelineEvent[]),
    automationLogs,
    tags: ((j.tags ?? []) as string[]),
    notes: (j.notes as string | undefined),
    contactIds: ((j.contactIds ?? []) as string[]),
    profileDocumentContext: (j.profileDocumentContext as Job["profileDocumentContext"]) ?? undefined,
  };
}

/**
 * Normalizes a list of raw backend Jobs.
 */
export function normalizeJobsForUi(raw: unknown[]): Job[] {
  return raw.map(normalizeJobForUi);
}

/**
 * Normalizes a raw backend Application.
 */
export function normalizeApplicationForUi(raw: unknown): Application {
  const a = (raw ?? {}) as Record<string, unknown>;
  const id = ((a.id ?? a._id) as string) ?? "";
  const applicationStatus = (a.applicationStatus ?? a.status) as Application["applicationStatus"];
  return {
    ...(a as unknown as Application),
    id,
    _id: id,
    applicationStatus,
    status: (a.status as Application["status"]) ?? applicationStatus,
    jobId: (a.jobId as string) ?? "",
    company: (a.company as string) ?? "",
    position: (a.position as string) ?? "",
    source: (a.source as string) ?? "",
    contactEmail: (a.contactEmail as string) ?? "",
    jobUrl: (a.jobUrl as string) ?? "",
    responseStatus: (a.responseStatus as Application["responseStatus"]) ?? "No Response",
    followUpStatus: (a.followUpStatus as Application["followUpStatus"]) ?? "Not Needed",
    dateFound: (a.dateFound as string) ?? new Date().toISOString(),
    timeline: Array.isArray(a.timeline) ? (a.timeline as Application["timeline"]) : [],
    automationLogs: Array.isArray(a.automationLogs) ? (a.automationLogs as Application["automationLogs"]) : [],
    automationHealth: (a.automationHealth as Application["automationHealth"]) ?? "Healthy",
    responseDetected: Boolean(a.responseDetected),
    aiClassification: (a.aiClassification as string) ?? "",
    createdAt: (a.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (a.updatedAt as string) ?? new Date().toISOString(),
    dateApplied: (a.dateApplied as string | undefined) ?? (a.appliedAt as string | undefined),
    reminderStatus: (a.reminderStatus as Application["reminderStatus"]) ?? (a.followUpStatus as Application["followUpStatus"]) ?? "Not Needed",
  };
}

/**
 * Normalizes a list of raw backend Applications.
 */
export function normalizeApplicationsForUi(raw: unknown[]): Application[] {
  return raw.map(normalizeApplicationForUi);
}

/**
 * Normalizes a raw backend Contact document to the UI Contact shape.
 */
export function normalizeContactForUi(raw: unknown): Contact {
  const c = (raw ?? {}) as Record<string, unknown>;
  const id = String((c.id ?? c._id) ?? "");
  const name = (c.name as string) ?? "";
  const parts = name.trim().split(/\s+/);
  const relatedJobs: ContactRelatedJob[] = Array.isArray(c.relatedJobs)
    ? (c.relatedJobs as ContactRelatedJob[])
    : Array.isArray(c.relatedJobIds)
      ? (c.relatedJobIds as string[]).map((rid) => ({
          id: rid,
          company: "",
          position: "",
          status: "",
        }))
      : [];
  return {
    ...(c as unknown as Contact),
    id,
    _id: id,
    name,
    firstName: (c.firstName as string) ?? parts[0] ?? "",
    lastName: (c.lastName as string) ?? parts.slice(1).join(" ") ?? "",
    fullName: (c.fullName as string) ?? name,
    company: (c.company as string) ?? "",
    role: (c.role as string) ?? (c.title as string) ?? "",
    title: (c.title as string) ?? (c.role as string) ?? "",
    relationship: (c.relationship as Contact["relationship"]) ?? "Other",
    type: (c.type as Contact["type"]) ?? (c.relationship as Contact["relationship"]) ?? "Other",
    email: (c.email as string) ?? "",
    linkedInUrl: (c.linkedInUrl as string) ?? (c.linkedinUrl as string),
    linkedinUrl: (c.linkedinUrl as string) ?? (c.linkedInUrl as string),
    location: (c.location as string) ?? "",
    source: (c.source as string) ?? "",
    followUpStatus: (c.followUpStatus as Contact["followUpStatus"]) ?? "Not Needed",
    nextFollowUpDate: (c.nextFollowUpDate ?? c.followUpDue) as Contact["nextFollowUpDate"],
    followUpDue: (c.followUpDue ?? c.nextFollowUpDate) as Contact["followUpDue"],
    reminderEnabled: Boolean(c.reminderEnabled),
    relatedJobs,
    jobIds: Array.isArray(c.jobIds) ? (c.jobIds as string[]) : relatedJobs.map((j) => j.id),
    communicationHistory: Array.isArray(c.communicationHistory)
      ? (c.communicationHistory as ContactCommunicationEvent[])
      : [],
    automationLogs: Array.isArray(c.automationLogs) ? (c.automationLogs as ContactAutomationLog[]) : [],
    notes: (c.notes as string) ?? "",
    lastContacted: ((c.lastContacted ?? c.lastContactedAt) as string) ?? new Date().toISOString(),
    lastContactedAt: (c.lastContactedAt as string) ?? (c.lastContacted as string),
    archived: Boolean(c.archived),
    createdAt: (c.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (c.updatedAt as string) ?? new Date().toISOString(),
  };
}

export function normalizeContactsForUi(raw: unknown[]): Contact[] {
  return raw.map(normalizeContactForUi);
}

function mapBackendCalendarToUi(raw: string | undefined): Interview["calendarStatus"] {
  if (raw === "Created" || raw === "Synced") return "Synced";
  return "Pending";
}

/** Maps backend interview calendar + enums into the dashboard Interview shape. */
export function normalizeInterviewForUi(raw: unknown): Interview {
  const row = (raw ?? {}) as Record<string, unknown>;
  const id = String(row.id ?? row._id ?? "");
  const durationMinutes = typeof row.durationMinutes === "number" ? row.durationMinutes : Number(row.durationMinutes) || 60;
  const dateRaw = row.dateTime ?? row.date;
  const dateTime =
    typeof dateRaw === "string"
      ? dateRaw
      : dateRaw instanceof Date
        ? dateRaw.toISOString()
        : new Date().toISOString();

  const prepChecklistRaw = Array.isArray(row.prepChecklist) ? row.prepChecklist : [];
  const prepChecklist: InterviewPrepChecklistItem[] = prepChecklistRaw.map((item: unknown, i: number) => {
    const it = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(it.id ?? `chk_${id}_${i}`),
      label: String(it.label ?? ""),
      done: Boolean(it.done),
    };
  });

  const timeline: InterviewTimelineEvent[] = Array.isArray(row.timeline)
    ? (row.timeline as InterviewTimelineEvent[])
    : [];
  const automationLogs: InterviewAutomationLog[] = Array.isArray(row.automationLogs)
    ? (row.automationLogs as InterviewAutomationLog[])
    : [];

  const calRaw = row.calendarStatus as string | undefined;

  return {
    ...(row as unknown as Interview),
    id,
    _id: id,
    jobId: String(row.jobId ?? ""),
    applicationId: String(row.applicationId ?? ""),
    company: String(row.company ?? ""),
    position: String(row.position ?? ""),
    interviewType: (row.interviewType as Interview["interviewType"]) ?? "Technical",
    status: (row.status as Interview["status"]) ?? "Scheduled",
    dateTime,
    durationMinutes,
    interviewerName: String(row.interviewerName ?? ""),
    interviewerRole: String(row.interviewerRole ?? ""),
    contactEmail: String(row.contactEmail ?? ""),
    meetingLink: String(row.meetingLink ?? ""),
    location: String(row.location ?? ""),
    prepStatus: (row.prepStatus as Interview["prepStatus"]) ?? "Not Started",
    calendarStatus: mapBackendCalendarToUi(calRaw),
    calendarEventId: String(row.calendarEventId ?? ""),
    relatedJobStatus: String(row.relatedJobStatus ?? ""),
    notesSummary: String(row.notesSummary ?? ""),
    aiPrepSummary: String(row.aiPrepSummary ?? ""),
    followUpMessagePreview: String(row.followUpMessagePreview ?? ""),
    prepChecklist,
    timeline,
    automationLogs,
  };
}

export function normalizeInterviewsForUi(raw: unknown[]): Interview[] {
  return raw.map(normalizeInterviewForUi);
}

function mapBackendDocTypeToUi(t: string): DocumentType {
  switch (t) {
    case "CV":
      return "CV";
    case "Cover Letter":
      return "Cover Letter";
    case "Research":
      return "Research Document";
    case "Portfolio":
      return "Research Document";
    case "Other":
      return "Email Template";
    default:
      return "CV";
  }
}

function mapBackendDocStatusToUi(s: string): DocumentStatus {
  switch (s) {
    case "Sent":
      return "Exported";
    case "Draft":
    case "Ready":
    case "Archived":
      return s as DocumentStatus;
    default:
      return "Draft";
  }
}

function mapPdfExportStatusFromBackend(pes: string | undefined): PDFExportStatus | undefined {
  switch (pes) {
    case "Exported":
      return "Exported";
    case "Failed":
      return "Failed";
    case "Preview Only":
      return "Preview Only";
    case "Queued":
    case "Not Started":
      return "Pending";
    default:
      return undefined;
  }
}

export function normalizeDocumentRowStatusToPdfStatus(row: DocumentRecord): PDFExportStatus {
  if (row.pdfExportStatus) return row.pdfExportStatus;
  if (row.status === "Failed") return "Failed";
  if (row.status === "Needs Review") return "Needs Review";
  return "Pending";
}

/** Maps Mongo Document row into UI DocumentRecord used by tables and tabs. */
export function normalizeDocumentRecordForUi(raw: unknown): DocumentRecord {
  const d = (raw ?? {}) as Record<string, unknown>;
  const meta = (d.metadata && typeof d.metadata === "object" ? d.metadata : {}) as Record<string, unknown>;
  const id = String(d.id ?? d._id ?? "");
  const company = String(d.company ?? meta.company ?? "");
  const position = String(d.position ?? meta.position ?? "");
  const storagePath = String(d.storagePath ?? meta.storagePath ?? "");
  const jobId = d.jobId ? String(d.jobId) : undefined;
  const rawType = String(d.type ?? "Other");
  const type = mapBackendDocTypeToUi(rawType);
  const rawStatus = String(d.status ?? "Draft");
  const status = mapBackendDocStatusToUi(rawStatus);
  const lastUpdatedRaw = d.lastUpdated ?? d.updatedAt;
  const lastUpdated =
    typeof lastUpdatedRaw === "string"
      ? lastUpdatedRaw
      : lastUpdatedRaw instanceof Date
        ? lastUpdatedRaw.toISOString()
        : new Date().toISOString();

  const pdfExportStatusRaw = mapPdfExportStatusFromBackend(d.pdfExportStatus as string | undefined);
  let pdfExportStatus = pdfExportStatusRaw;
  const rawPdfUrl = d.pdfUrl ? String(d.pdfUrl) : undefined;
  const pdfUrl = rawPdfUrl && isPublicFileUrl(rawPdfUrl, API_URL) ? rawPdfUrl : undefined;
  const rawStorageUrl = d.storageUrl ? String(d.storageUrl) : undefined;
  const storageUrl =
    rawStorageUrl && isPublicFileUrl(rawStorageUrl, API_URL) ? rawStorageUrl : undefined;
  if (
    !pdfExportStatus &&
    (meta.textExportAvailable === true ||
      meta.exportStatus === "preview-only" ||
      meta.exportStatus === "completed-text")
  ) {
    pdfExportStatus = "Preview Only";
  }
  const routingStatus = d.routingStatus as DocumentRecord["routingStatus"];

  return {
    ...(d as unknown as DocumentRecord),
    id,
    _id: id,
    fileName: String(d.fileName ?? "Untitled"),
    type,
    relatedJob:
      String(d.relatedJob ?? meta.relatedJob ?? (company || position ? `${company} / ${position}` : "—")),
    company,
    position,
    status,
    storageLocation: storagePath || String(d.storageLocation ?? ""),
    lastUpdated,
    jobId,
    storageUrl,
    pdfExportStatus,
    pdfUrl,
    routingStatus,
  };
}

export function normalizeDocumentRecordsForUi(raw: unknown[]): DocumentRecord[] {
  return raw.map(normalizeDocumentRecordForUi);
}

const defaultAutomationConfiguration = (): AutomationConfiguration => ({
  connectedAccount: "Not connected",
  environment: "Development",
  retryPolicy: "3 retries",
  errorHandling: "Enabled",
});

function mapBackendReportType(t: string): ReportHistoryRecord["type"] {
  const allowed: ReportHistoryRecord["type"][] = ["Daily Digest", "Weekly Performance", "PDF Export", "Manual Report"];
  return (allowed.includes(t as ReportHistoryRecord["type"]) ? t : "Manual Report") as ReportHistoryRecord["type"];
}

function mapBackendReportStatus(s: string): ReportHistoryRecord["status"] {
  const allowed: ReportHistoryRecord["status"][] = ["Sent", "Generated", "Failed", "Scheduled"];
  return (allowed.includes(s as ReportHistoryRecord["status"]) ? s : "Generated") as ReportHistoryRecord["status"];
}

/** Human-readable Google delivery gap from saved report `data` (aligned with API test-send messaging). */
export function summarizeGoogleDeliveryWarning(data: Record<string, unknown>): string | undefined {
  const gd = data.googleDelivery;
  if (!gd || typeof gd !== "object") return undefined;
  const g = gd as Record<string, unknown>;
  if (g.success === true && g.fallbackUsed !== true) return undefined;

  const reconnect = g.reconnectRequired === true ? " Reconnect the integration in Settings." : "";
  const endpointType = typeof g.endpointType === "string" ? g.endpointType : "";
  const requiredScope = typeof g.requiredScope === "string" ? g.requiredScope : "";

  if (endpointType === "oauth.precondition") {
    const base =
      typeof g.googleErrorMessage === "string" && g.googleErrorMessage.trim()
        ? g.googleErrorMessage.trim()
        : requiredScope
          ? `Missing OAuth scope: ${requiredScope}`
          : "Google OAuth precondition failed.";
    return `${base}${reconnect}`;
  }

  if (
    endpointType === "docs.documents.batchUpdate" ||
    requiredScope.includes("documents") ||
    endpointType.includes("documents")
  ) {
    return `Google Docs scope missing or insufficient. Reconnect Google Drive integration.${reconnect}`;
  }

  if (
    endpointType.startsWith("gmail.") ||
    requiredScope.includes("gmail.send") ||
    requiredScope.includes("/auth/gmail")
  ) {
    return `Gmail send scope missing. Reconnect Gmail integration.${reconnect}`;
  }

  if (endpointType.startsWith("drive.") || requiredScope.includes("drive")) {
    return `Google Drive write failed or scope insufficient. Reconnect Google Drive integration.${reconnect}`;
  }

  const code = typeof g.statusCode === "number" ? g.statusCode : 0;
  const brief =
    typeof g.googleErrorMessage === "string"
      ? g.googleErrorMessage.slice(0, 220)
      : typeof g.googleErrorReason === "string"
        ? g.googleErrorReason
        : "Google API delivery skipped.";
  return code === 403 ? `Google delivery failed (403): ${brief}.${reconnect}` : `${brief}${reconnect}`;
}

/** Human-readable per-channel outcomes from report `data.providerResults`. */
export function summarizeProviderResults(data: Record<string, unknown>): string | undefined {
  const pr = data.providerResults;
  if (!pr || typeof pr !== "object") return undefined;
  const p = pr as Record<string, Record<string, unknown>>;
  const lines: string[] = [];
  for (const key of ["telegram", "slack", "email"]) {
    const x = p[key];
    if (!x || typeof x !== "object") continue;
    const attempted = Boolean(x.attempted);
    const configured = Boolean(x.configured);
    const success = Boolean(x.success);
    const msg = typeof x.message === "string" ? x.message : "";
    lines.push(
      `${key}: configured=${configured}, attempted=${attempted}, success=${success}${msg ? ` — ${msg}` : ""}`,
    );
  }
  return lines.length ? lines.join("\n") : undefined;
}

/** Normalizes API / DB report row to `ReportHistoryRecord`. */
export function normalizeReportForUi(raw: unknown): ReportHistoryRecord {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = String(r.id ?? r._id ?? "");
  const sentToRaw = r.sentTo;
  const sentTo = Array.isArray(sentToRaw)
    ? sentToRaw.filter(Boolean).join(", ") || "—"
    : typeof sentToRaw === "string"
      ? sentToRaw
      : "—";
  const dataObj = (r.data && typeof r.data === "object" ? r.data : {}) as Record<string, unknown>;
  const previewOnly = Boolean(dataObj.previewOnly);
  const deliveryStatusRaw = String(r.deliveryStatus ?? "");
  const genAt = r.generatedAt ?? r.createdAt ?? new Date().toISOString();
  const deliveryWarning = Boolean(dataObj.deliveryWarning);
  const googleSum = summarizeGoogleDeliveryWarning(dataObj);
  const providerSummary = summarizeProviderResults(dataObj);
  const deliveryWarningSummary = [googleSum, providerSummary].filter(Boolean).join("\n\n") || undefined;
  const deliveryOutcome = typeof dataObj.deliveryOutcome === "string" ? dataObj.deliveryOutcome : undefined;
  return {
    id,
    reportName: String(r.name ?? r.reportName ?? "Report"),
    type: mapBackendReportType(String(r.type ?? "Manual Report")),
    status: mapBackendReportStatus(String(r.status ?? "Generated")),
    generatedAt: typeof genAt === "string" ? genAt : new Date(genAt as Date).toISOString(),
    sentTo,
    deliveryMethod: String(r.deliveryMethod ?? "dashboard"),
    summaryText: typeof r.summaryText === "string" ? r.summaryText : undefined,
    deliveryStatus: deliveryStatusRaw,
    deliveryOutcome,
    previewOnly,
    pdfUrl: typeof r.pdfUrl === "string" && r.pdfUrl ? r.pdfUrl : undefined,
    googleDocUrl: typeof dataObj.googleDocUrl === "string" ? dataObj.googleDocUrl : undefined,
    deliveryWarning,
    deliveryWarningSummary,
  };
}

export function normalizeReportsForUi(raw: unknown[]): ReportHistoryRecord[] {
  return raw.map(normalizeReportForUi);
}

/** Maps `getReportStats` / `getReportsSummary` API payload into dashboard `ReportStats` cards. */
export function normalizeReportStatsForUi(raw: unknown, fallback: ReportStats): ReportStats {
  const r = raw as Record<string, unknown> | null | undefined;
  if (!r || typeof r !== "object") return fallback;
  if ("reportsGenerated" in r && typeof r.reportsGenerated === "number") {
    const last =
      typeof r.lastReport === "string"
        ? r.lastReport
        : typeof r.lastReportAt === "string"
          ? new Date(r.lastReportAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
          : fallback.lastReport;
    return {
      ...fallback,
      ...(r as unknown as ReportStats),
      lastReport: last,
    };
  }
  const total = Number(r.totalReports ?? 0);
  const failed = Number(r.failedReports ?? 0);
  const sent = Number(r.sentReports ?? 0);
  const rate = total > 0 ? Math.round(((total - failed) / total) * 100) : fallback.successRate;
  const latestArr = r.latestReports as unknown[] | undefined;
  const latest = latestArr && latestArr[0] ? (latestArr[0] as Record<string, unknown>) : null;
  const lastReport =
    latest?.generatedAt != null
      ? new Date(String(latest.generatedAt)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : fallback.lastReport;
  return {
    reportsGenerated: Number(r.reportsGenerated ?? total ?? 0),
    dailyDigestsSent: Number(r.dailyDigestsSent ?? sent ?? 0),
    weeklyReportsSent: Number(r.weeklyReportsSent ?? 0),
    pdfExports: Number(r.pdfExports ?? 0),
    successRate: Number.isFinite(rate) ? rate : 0,
    lastReport,
  };
}

/** Converts analytics metrics into the Daily Digest preview card shape. */
export function normalizeDailyDigestDataForUi(raw: unknown, fallback: DailyDigestData): DailyDigestData {
  const m = raw as Record<string, unknown> | null | undefined;
  if (!m || typeof m !== "object" || !("newJobs" in m || "applicationsSent" in m)) {
    return fallback;
  }
  const failed = Number(m.failedAutomations ?? fallback.failedAutomations);
  const followDue = Number(m.followUpsDue ?? fallback.followUpsDue);
  const deadlines = Number(m.deadlinesApproaching ?? fallback.deadlinesApproaching);
  const recommendedActions: string[] = [];
  if (failed > 0) recommendedActions.push("Review failed automations in Automation Logs.");
  if (followDue > 0) recommendedActions.push(`Clear ${followDue} pending follow-up${followDue === 1 ? "" : "s"}.`);
  if (deadlines > 0) recommendedActions.push(`${deadlines} deadline${deadlines === 1 ? "" : "s"} approaching — prioritize submissions.`);
  if (!recommendedActions.length) recommendedActions.push("Pipeline looks steady — keep your application cadence.");
  return {
    ...fallback,
    date: String(m.date ?? fallback.date),
    newJobsDetected: Number(m.newJobs ?? m.newJobsDetected ?? fallback.newJobsDetected),
    applicationsSent: Number(m.applicationsSent ?? fallback.applicationsSent),
    followUpsDue: followDue,
    repliesReceived: Number(m.repliesReceived ?? fallback.repliesReceived),
    interviewsScheduled: Number(m.interviewsScheduled ?? fallback.interviewsScheduled),
    deadlinesApproaching: deadlines,
    failedAutomations: failed,
    recommendedActions,
  };
}

/** Converts weekly analytics metrics into chart-friendly `WeeklyReportData`. */
export function normalizeWeeklyReportDataForUi(raw: unknown, fallback: WeeklyReportData): WeeklyReportData {
  const m = raw as Record<string, unknown> | null | undefined;
  if (!m || typeof m !== "object" || !("applicationsSubmitted" in m)) {
    return fallback;
  }
  const rr = Number(m.responseRate ?? 0);
  const ir = Number(m.interviewConversionRate ?? 0);
  const topSources = Array.isArray(m.topSources)
    ? (m.topSources as { source: string; count: number }[])
    : fallback.topSources;
  const rec = Array.isArray(m.recommendations) ? (m.recommendations as string[]) : [];
  const pb = m.pipelineBreakdown as { applications?: Record<string, number> } | undefined;
  const appsPb = pb?.applications ?? {};
  const pipelineConversion =
    Object.keys(appsPb).length > 0
      ? Object.entries(appsPb).map(([stage, conversion]) => ({ stage, conversion: Number(conversion) }))
      : [];
  return {
    ...fallback,
    weekRange:
      m.weekStart && m.weekEnd
        ? `${String(m.weekStart)} – ${String(m.weekEnd)}`
        : fallback.weekRange,
    totalJobsFound: Number(m.totalJobsFound ?? fallback.totalJobsFound),
    applicationsSubmitted: Number(m.applicationsSubmitted ?? fallback.applicationsSubmitted),
    responseRate: rr <= 1 ? Math.round(rr * 100) : Math.round(rr),
    interviewConversionRate: ir <= 1 ? Math.round(ir * 100) : Math.round(ir),
    offersReceived: Number(m.offersReceived ?? fallback.offersReceived),
    topSources,
    bestPerformingCategories: rec.length ? rec.slice(0, 3) : fallback.bestPerformingCategories,
    bottlenecks: rec.length > 3 ? rec.slice(3) : fallback.bottlenecks,
    nextWeekFocus: fallback.nextWeekFocus,
    applicationsBySource: topSources.length ? topSources : fallback.applicationsBySource,
    responseRateTrend: [],
    pipelineConversion: pipelineConversion.length ? pipelineConversion : fallback.pipelineConversion,
  };
}

function mapAutomationCategoryBackendToUi(c: string): AutomationCategory {
  switch (c) {
    case "Jobs":
      return "Intake";
    case "Applications":
      return "Pipeline";
    case "Contacts":
      return "Communication";
    case "Interviews":
      return "Pipeline";
    case "Documents":
      return "Documents";
    case "Reports":
      return "Reporting";
    case "System":
      return "Monitoring";
    default:
      return "Monitoring";
  }
}

export function mapAutomationStatusBackendToUi(s: string): AutomationStatus {
  switch (s) {
    case "Healthy":
      return "Active";
    case "Paused":
      return "Paused";
    case "Error":
      return "Failed";
    case "Warning":
      return "Needs Setup";
    default:
      return "Needs Setup";
  }
}

/** PATCH body: UI Active/Paused → Mongo automation status strings. */
export function automationUiStatusToBackend(status: AutomationStatus): "Healthy" | "Paused" | "Warning" | "Error" {
  switch (status) {
    case "Active":
      return "Healthy";
    case "Paused":
      return "Paused";
    case "Failed":
      return "Error";
    default:
      return "Warning";
  }
}

export function normalizeAutomationModuleForUi(raw: unknown): AutomationModule {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = String(r.moduleKey ?? r.id ?? r._id ?? "");
  const rawActions = Array.isArray(r.actions) ? (r.actions as AutomationAction[]) : [];
  const actions: AutomationAction[] =
    rawActions.length > 0
      ? rawActions
      : [{ id: "stub", title: "Automation steps", detail: "See module configuration in backend." }];
  const ms = Number(r.averageDurationMs);
  const avg =
    Number.isFinite(ms) && ms > 0 ? `${Math.round(ms)}ms` : String(r.averageDuration ?? "—");
  const cfg =
    r.configuration && typeof r.configuration === "object"
      ? ({ ...defaultAutomationConfiguration(), ...(r.configuration as object) } as AutomationConfiguration)
      : defaultAutomationConfiguration();
  const iconRaw = r.icon;
  return {
    id,
    name: String(r.name ?? id),
    description: String(r.description ?? ""),
    category: mapAutomationCategoryBackendToUi(String(r.category ?? "System")),
    status: mapAutomationStatusBackendToUi(String(r.status ?? "Warning")),
    icon: typeof iconRaw === "string" && iconRaw.length > 0 ? iconRaw : "Bot",
    lastRun: (r.lastRunAt ?? r.lastRun) as AutomationModule["lastRun"],
    nextRun: (r.nextRunAt ?? r.nextRun) as AutomationModule["nextRun"],
    successRate: Number(r.successRate ?? 0),
    totalRuns: Number(r.totalRuns ?? 0),
    failedRuns: Number(r.failedRuns ?? 0),
    averageDuration: avg,
    triggerType: String(r.triggerType ?? "Scheduled"),
    triggerSource: String(r.triggerSource ?? "System"),
    schedule: String(r.schedule ?? ""),
    inputSource: String(r.inputSource ?? ""),
    actions,
    configuration: cfg,
    recentLogs: [],
    lastRunAt: r.lastRunAt as string | undefined,
    nextRunAt: r.nextRunAt as string | undefined,
    runCount: Number(r.totalRuns ?? 0),
    errorCount: Number(r.failedRuns ?? 0),
    config: (r.configuration as Record<string, unknown>) ?? {},
  };
}

export function normalizeAutomationModulesForUi(raw: unknown[]): AutomationModule[] {
  return raw.map(normalizeAutomationModuleForUi);
}

function mapAutomationLogStatusBackendToUi(s: string): AutomationLog["status"] {
  switch (s) {
    case "Failed":
      return "Failed";
    case "Warning":
      return "Warning";
    case "Running":
      return "Warning";
    default:
      return "Success";
  }
}

export function normalizeAutomationLogForUi(raw: unknown): AutomationLog {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = String(r.id ?? r._id ?? "");
  const durMs = r.durationMs;
  const duration =
    typeof durMs === "number" && Number.isFinite(durMs) ? `${durMs}ms` : String(r.duration ?? "—");
  const created = r.createdAt ?? new Date().toISOString();
  const meta = r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : undefined;
  const relatedType = r.relatedRecordType != null ? String(r.relatedRecordType) : "";
  const relatedId = r.relatedRecordId != null ? String(r.relatedRecordId) : "";
  const jobIdFromRecord = relatedType === "Job" && relatedId ? relatedId : undefined;

  return {
    id,
    _id: id,
    moduleId: String(r.moduleKey ?? r.moduleId ?? ""),
    moduleName: String(r.moduleName ?? r.moduleKey ?? "Module"),
    status: mapAutomationLogStatusBackendToUi(String(r.status ?? "Success")),
    message: String(r.message ?? ""),
    relatedRecord: String(r.relatedRecordId ?? r.relatedRecord ?? r.relatedRecordType ?? "—"),
    duration,
    createdAt: typeof created === "string" ? created : new Date(created as Date).toISOString(),
    operationId: r.operationId ? String(r.operationId) : meta?.operationId ? String(meta.operationId) : undefined,
    jobId: meta?.jobId != null ? String(meta.jobId) : jobIdFromRecord,
    metadata: meta,
    technicalMessage: String(r.message ?? ""),
    error: typeof r.error === "string" && r.error.length > 0 ? r.error : undefined,
  };
}

export function normalizeAutomationLogsForUi(raw: unknown[]): AutomationLog[] {
  return raw.map(normalizeAutomationLogForUi);
}
