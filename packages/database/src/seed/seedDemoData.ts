import {
  ApplicationModel,
  AutomationLogModel,
  ContactModel,
  DocumentModel,
  IntegrationConnectionModel,
  InterviewModel,
  JobModel,
  ReportModel,
} from "../models";

function fp(tenantId: string, n: number): string {
  const tail = tenantId.replace(/[^a-fA-F0-9]/g, "").slice(-10) || "tenant";
  return `jobflow_demo_fp_${tail}_${String(n).padStart(2, "0")}`;
}

function demoNote(kind: string, n: number): string {
  return `__demo__:${kind}:${n}`;
}

const JOB_SEEDS: Array<{
  company: string;
  position: string;
  status: "New" | "Research" | "Drafting" | "Ready to Apply" | "Applied" | "Interview" | "Offer" | "Rejected" | "Archived";
  priority: "Low" | "Medium" | "High" | "Urgent";
  idx: number;
}> = [
  { idx: 1, company: "Northwind Labs", position: "Staff Engineer — Platform", status: "Research", priority: "High" },
  { idx: 2, company: "Blue Harbor AI", position: "Senior Frontend Engineer", status: "Drafting", priority: "High" },
  { idx: 3, company: "Vertex Systems", position: "Product Engineer", status: "Ready to Apply", priority: "Medium" },
  { idx: 4, company: "Acme Corp", position: "Senior Frontend Engineer", status: "Applied", priority: "High" },
  { idx: 5, company: "Cobalt Data", position: "ML Platform Engineer", status: "Interview", priority: "Urgent" },
  { idx: 6, company: "Signal Foundry", position: "Full Stack Engineer", status: "Applied", priority: "Medium" },
  { idx: 7, company: "Helio Commerce", position: "Engineering Lead", status: "New", priority: "Low" },
  { idx: 8, company: "Arcadia Health", position: "Staff Software Engineer", status: "Research", priority: "Medium" },
  { idx: 9, company: "Kite Mobility", position: "Backend Engineer (Go)", status: "Ready to Apply", priority: "High" },
  { idx: 10, company: "Redwood Fintech", position: "Security Engineer", status: "Drafting", priority: "Medium" },
  { idx: 11, company: "Orbit Analytics", position: "Data Platform Engineer", status: "Applied", priority: "Low" },
  { idx: 12, company: "Lumen Creative", position: "Design Technologist", status: "Rejected", priority: "Low" },
];

const MODULE_KEYS_ROTATE = [
  "job-intake",
  "duplicate-protection",
  "folder-automation",
  "applied-status",
  "interview-scheduling",
  "cv-routing",
  "email-reply-detection",
  "follow-up-reminder",
  "pdf-export",
  "research-document",
  "ai-processing",
  "network-follow-up",
  "offer-tracking",
  "deadline-alert",
  "lifecycle-monitoring",
  "daily-digest",
  "weekly-report",
] as const;

/**
 * Idempotent demo dataset for presentations: stable fingerprints and upserts so reruns do not duplicate rows.
 */
export async function seedDemoData(tenantId: string, createdBy = "system") {
  await seedIntegrationConnections(tenantId, createdBy);

  const jobs: Array<{ _id: unknown; company: string; position: string }> = [];
  for (const row of JOB_SEEDS) {
    const fingerprintHash = fp(tenantId, row.idx);
    const doc = await JobModel.findOneAndUpdate(
      { tenantId, fingerprintHash },
      {
        $set: {
          company: row.company,
          position: row.position,
          status: row.status,
          priority: row.priority,
          source: "Manual",
          duplicateStatus: row.idx === 4 ? "Unique" : "Unique",
          researchGenerated: row.status !== "New" && row.status !== "Research",
          draftGenerated: ["Drafting", "Ready to Apply", "Applied", "Interview"].includes(row.status),
          notes: demoNote("job", row.idx),
        },
        $setOnInsert: {
          tenantId,
          createdBy,
          fingerprintHash,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (doc) jobs.push({ _id: doc._id, company: row.company, position: row.position });
  }

  const jobIds = jobs.map((j) => String(j._id));
  const appTemplate = [
    { st: "Ready" as const, fu: "Scheduled" as const },
    { st: "Applied" as const, fu: "Scheduled" as const },
    { st: "Follow-Up Due" as const, fu: "Due Today" as const },
    { st: "Replied" as const, fu: "Not Needed" as const },
    { st: "Interview" as const, fu: "Not Needed" as const },
    { st: "Applied" as const, fu: "Overdue" as const },
    { st: "Drafted" as const, fu: "Scheduled" as const },
    { st: "Offer" as const, fu: "Not Needed" as const },
  ];
  for (let i = 0; i < 8; i++) {
    const jobId = jobIds[i];
    if (!jobId) break;
    const j = jobs[i]!;
    const t = appTemplate[i]!;
    const providerThreadId = `demo-thread-${tenantId.slice(-6)}-${i + 1}`;
    await ApplicationModel.findOneAndUpdate(
      { tenantId, jobId },
      {
        $set: {
          company: j.company,
          position: j.position,
          applicationStatus: t.st,
          responseStatus: i === 3 ? "Positive Reply" : "No Response",
          followUpStatus: t.fu,
          contactEmail: `recruiter${i + 1}@${j.company.toLowerCase().replace(/\s+/g, "")}.test`,
          providerThreadId,
          lastEmailSubject: i === 3 ? "Re: Your application" : "Application received",
        },
        $setOnInsert: {
          tenantId,
          createdBy,
          jobId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const contacts = [
    { n: 1, name: "Elena Rossi", rel: "Hiring Manager" as const, email: "elena.rossi@acmecorp.test" },
    { n: 2, name: "Marcus Chen", rel: "Recruiter" as const, email: "marcus@blueharbor.test" },
    { n: 3, name: "Priya Nandakumar", rel: "Recruiter" as const, email: "priya@vertex.test" },
    { n: 4, name: "Sam Okonkwo", rel: "Referral" as const, email: "sam.ok@kite.test" },
    { n: 5, name: "Jordan Lee", rel: "Employee" as const, email: "jordan.lee@helio.test" },
    { n: 6, name: "Avery Kim", rel: "Networking" as const, email: "avery@lumen.test" },
    { n: 7, name: "Noah Berg", rel: "Hiring Manager" as const, email: "noah@arcadia.test" },
    { n: 8, name: "Riley Patel", rel: "Recruiter" as const, email: "riley@signal.test" },
  ];
  for (const c of contacts) {
    await ContactModel.findOneAndUpdate(
      { tenantId, email: c.email },
      {
        $set: {
          name: c.name,
          relationship: c.rel,
          company: "Various",
          followUpStatus: c.n % 2 === 0 ? "Scheduled" : "Not Needed",
          notes: demoNote("contact", c.n),
        },
        $setOnInsert: { tenantId, createdBy },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const base = new Date("2026-04-15T15:00:00.000Z");
  const interviewSeeds: Array<{
    n: number;
    company: string;
    position: string;
    type: "Recruiter Screen" | "Technical" | "Behavioral" | "Hiring Manager" | "Panel" | "Final Round" | "Offer Discussion";
    dayOffset: number;
    jobIndex: number;
  }> = [
    { n: 1, company: "Cobalt Data", position: "ML Platform Engineer", type: "Technical", dayOffset: 2, jobIndex: 4 },
    { n: 2, company: "Acme Corp", position: "Senior Frontend Engineer", type: "Hiring Manager", dayOffset: 5, jobIndex: 3 },
    { n: 3, company: "Signal Foundry", position: "Full Stack Engineer", type: "Recruiter Screen", dayOffset: 1, jobIndex: 5 },
    { n: 4, company: "Vertex Systems", position: "Product Engineer", type: "Panel", dayOffset: 7, jobIndex: 2 },
    { n: 5, company: "Northwind Labs", position: "Staff Engineer — Platform", type: "Final Round", dayOffset: 10, jobIndex: 0 },
  ];
  for (const iv of interviewSeeds) {
    const dt = new Date(base);
    dt.setUTCDate(dt.getUTCDate() + iv.dayOffset);
    const jobId = jobIds[iv.jobIndex] ?? jobIds[0];
    const app = await ApplicationModel.findOne({ tenantId, jobId }).lean();
    const applicationId =
      app && !Array.isArray(app) && "_id" in app ? String((app as { _id: unknown })._id) : undefined;
    await InterviewModel.findOneAndUpdate(
      { tenantId, notes: demoNote("interview", iv.n) },
      {
        $set: {
          jobId,
          applicationId,
          company: iv.company,
          position: iv.position,
          interviewType: iv.type,
          status: "Scheduled",
          dateTime: dt,
          prepStatus: "In Progress",
          calendarStatus: "Not Created",
        },
        $setOnInsert: {
          tenantId,
          createdBy,
          notes: demoNote("interview", iv.n),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const docSeeds: Array<{
    n: number;
    fileName: string;
    type: "CV" | "Cover Letter" | "Research" | "Portfolio" | "Other";
    status: "Draft" | "Ready" | "Sent" | "Archived";
    jobIndex: number | null;
    appIndex: number | null;
    kind: "Research" | "Cover Letter" | "CV" | "PDF Export" | "Other";
  }> = [
    { n: 1, fileName: "Acme-CV-v3.pdf", type: "CV", status: "Ready", jobIndex: 3, appIndex: 3, kind: "CV" },
    { n: 2, fileName: "BlueHarbor-Cover-v2.md", type: "Cover Letter", status: "Draft", jobIndex: 1, appIndex: 1, kind: "Cover Letter" },
    { n: 3, fileName: "Vertex-Research-Brief.pdf", type: "Research", status: "Ready", jobIndex: 2, appIndex: 2, kind: "Research" },
    { n: 4, fileName: "Cobalt-Tech-Prep.pdf", type: "Research", status: "Ready", jobIndex: 4, appIndex: 4, kind: "Research" },
    { n: 5, fileName: "Signal-Portfolio.zip", type: "Portfolio", status: "Archived", jobIndex: 5, appIndex: 5, kind: "Other" },
    { n: 6, fileName: "Helio-Exec-Summary.pdf", type: "Research", status: "Draft", jobIndex: 6, appIndex: null, kind: "Research" },
    { n: 7, fileName: "Arcadia-Cover-Final.pdf", type: "Cover Letter", status: "Sent", jobIndex: 7, appIndex: null, kind: "Cover Letter" },
    { n: 8, fileName: "Kite-Backend-Notes.pdf", type: "Research", status: "Ready", jobIndex: 8, appIndex: null, kind: "Research" },
    { n: 9, fileName: "Redwood-Security-CV.pdf", type: "CV", status: "Ready", jobIndex: 9, appIndex: null, kind: "CV" },
    { n: 10, fileName: "Orbit-Analytics-Cover.pdf", type: "Cover Letter", status: "Draft", jobIndex: 10, appIndex: null, kind: "Cover Letter" },
    { n: 11, fileName: "Lumen-Design-Tech-CL.pdf", type: "Cover Letter", status: "Archived", jobIndex: 11, appIndex: null, kind: "Cover Letter" },
    { n: 12, fileName: "Weekly-Export-Pack.pdf", type: "Other", status: "Ready", jobIndex: null, appIndex: null, kind: "PDF Export" },
    { n: 13, fileName: "Networking-Followups.pdf", type: "Other", status: "Draft", jobIndex: null, appIndex: null, kind: "Other" },
    { n: 14, fileName: "Interview-Prep-Checklist.pdf", type: "Research", status: "Ready", jobIndex: 4, appIndex: 4, kind: "Research" },
    { n: 15, fileName: "Offer-Comparison-Grid.pdf", type: "Research", status: "Draft", jobIndex: 7, appIndex: 7, kind: "Research" },
  ];
  for (const d of docSeeds) {
    const jobId = d.jobIndex !== null ? jobIds[d.jobIndex] : undefined;
    let applicationId: string | undefined;
    if (d.appIndex !== null && jobIds[d.appIndex]) {
      const ap = await ApplicationModel.findOne({ tenantId, jobId: jobIds[d.appIndex]! }).lean();
      applicationId =
        ap && !Array.isArray(ap) && "_id" in ap ? String((ap as { _id: unknown })._id) : undefined;
    }
    await DocumentModel.findOneAndUpdate(
      { tenantId, fileName: d.fileName },
      {
        $set: {
          jobId,
          applicationId,
          type: d.type,
          status: d.status,
          documentKind: d.kind,
          generationStatus: "Generated",
          pdfExportStatus: d.kind === "PDF Export" ? "Exported" : "Not Started",
        },
        $setOnInsert: {
          tenantId,
          createdBy,
          fileName: d.fileName,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const reportSeeds: Array<{
    type: "Daily Digest" | "Weekly Performance" | "PDF Export" | "Manual Report";
    status: "Sent" | "Generated" | "Failed" | "Scheduled";
    name: string;
    periodKey: string;
  }> = [
    { type: "Daily Digest", status: "Generated", name: "Daily Digest — May 01", periodKey: "2026-05-01" },
    { type: "Daily Digest", status: "Generated", name: "Daily Digest — May 02", periodKey: "2026-05-02" },
    { type: "Weekly Performance", status: "Generated", name: "Weekly Performance — W17", periodKey: "2026-W17" },
    { type: "Weekly Performance", status: "Scheduled", name: "Weekly Performance — W18", periodKey: "2026-W18" },
    { type: "PDF Export", status: "Generated", name: "Pipeline PDF Export", periodKey: "2026-05-pdf-1" },
    { type: "Manual Report", status: "Generated", name: "Stakeholder snapshot", periodKey: "2026-manual-1" },
  ];
  for (const r of reportSeeds) {
    await ReportModel.findOneAndUpdate(
      { tenantId, type: r.type, periodKey: r.periodKey },
      {
        $set: {
          status: r.status,
          name: r.name,
          generatedAt: new Date(),
          deliveryStatus: r.status === "Generated" ? "Sent" : "Not Sent",
        },
        $setOnInsert: {
          tenantId,
          createdBy,
          type: r.type,
          periodKey: r.periodKey,
          data: {},
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const statuses: Array<"Success" | "Warning" | "Failed" | "Running"> = [
    "Success",
    "Success",
    "Success",
    "Warning",
    "Failed",
    "Success",
    "Running",
    "Success",
    "Success",
    "Warning",
    "Success",
    "Failed",
    "Success",
    "Success",
    "Success",
    "Warning",
    "Success",
    "Success",
    "Success",
    "Failed",
    "Success",
    "Success",
    "Warning",
    "Success",
    "Success",
    "Success",
    "Success",
    "Success",
    "Warning",
    "Success",
  ];
  for (let i = 0; i < 30; i++) {
    const moduleKey = MODULE_KEYS_ROTATE[i % MODULE_KEYS_ROTATE.length]!;
    const key = `demo-seed-log-${tenantId.slice(-8)}-${String(i + 1).padStart(2, "0")}`;
    const st = statuses[i] ?? "Success";
    await AutomationLogModel.findOneAndUpdate(
      { tenantId, idempotencyKey: key },
      {
        $set: {
          moduleKey,
          moduleName: moduleKey,
          status: st,
          message:
            st === "Failed"
              ? "Simulated failure for QA dashboards"
              : st === "Warning"
                ? "Completed with warnings — review metadata"
                : "Automation run recorded for demo workspace",
          durationMs: 120 + i * 7,
          relatedRecordType: i % 3 === 0 ? "Job" : i % 3 === 1 ? "Application" : "Document",
          error: st === "Failed" ? "Stub provider timeout (demo)" : undefined,
        },
        $setOnInsert: {
          tenantId,
          createdBy,
          idempotencyKey: key,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedIntegrationConnections(tenantId: string, createdBy: string) {
  const rows: Array<{
    provider: "Gmail" | "Google Drive" | "Google Calendar" | "Claude" | "SMTP" | "Slack";
    status: "Connected" | "Not Connected" | "Needs Attention" | "Expired" | "Disabled";
    connectedEmail?: string;
    accountName?: string;
    metadata: Record<string, unknown>;
  }> = [
    {
      provider: "Gmail",
      status: "Connected",
      connectedEmail: "inbox.demo@jobflow.ai",
      metadata: { demoLabel: "Gmail Connected demo" },
    },
    {
      provider: "Google Drive",
      status: "Connected",
      accountName: "JobFlow Demo Drive",
      metadata: { demoLabel: "Google Drive Connected demo" },
    },
    {
      provider: "Google Calendar",
      status: "Connected",
      metadata: { demoLabel: "Google Calendar Connected demo", primaryCalendarId: "primary" },
    },
    {
      provider: "Claude",
      status: "Connected",
      metadata: { demoLabel: "Claude Connected demo", stubEnabled: true },
    },
    {
      provider: "SMTP",
      status: "Not Connected",
      metadata: { demoLabel: "SMTP Not Connected" },
    },
    {
      provider: "Slack",
      status: "Not Connected",
      metadata: { demoLabel: "Slack Optional", optional: true },
    },
  ];

  for (const row of rows) {
    await IntegrationConnectionModel.findOneAndUpdate(
      { tenantId, provider: row.provider },
      {
        $set: {
          status: row.status,
          connectedEmail: row.connectedEmail,
          accountName: row.accountName,
          syncStatus: row.status === "Connected" ? "OK" : "Idle",
          metadata: row.metadata,
          lastSyncAt: row.status === "Connected" ? new Date() : undefined,
        },
        $setOnInsert: {
          tenantId,
          createdBy,
          provider: row.provider,
          scopes: [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}
