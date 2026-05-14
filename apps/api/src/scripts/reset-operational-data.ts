import { connectDatabase, disconnectDatabase, getDatabaseStatus } from "@jobflow/database";
import {
  AiUsageLogModel,
  ApplicationModel,
  AutomationLogModel,
  DocumentModel,
  IntegrationConnectionModel,
  InterviewModel,
  JobModel,
  NotificationModel,
  ReportModel,
  TenantModel,
  UserModel,
} from "@jobflow/database/models";
import mongoose from "mongoose";

type CountMap = Record<string, number>;

const PRESERVED_DOCUMENT_TYPES = [
  "cv",
  "CV",
  "resume",
  "Resume",
  "cv_resume",
  "master_cv",
  "cover_letter_template",
  "template",
  "Template",
];

const GENERATED_DOCUMENT_TYPES = [
  "research",
  "Research",
  "research_document",
  "cover_letter",
  "Cover Letter",
  "ai_draft",
  "ai_analysis",
  "weekly_report",
  "daily_digest",
  "pdf_export",
  "PDF Export",
  "report",
  "Report",
];

const RAW_OPERATIONAL_COLLECTIONS = [
  "reporthistories",
  "pdfexportrecords",
  "followupreminders",
  "deadlinealerts",
  "queuejobs",
  "automationqueuejobs",
  "workerqueuejobs",
  "processingrecords",
  "temporaryprocessingrecords",
  "tempprocessingrecords",
  "jobprocessingrecords",
];

function hasArg(name: string) {
  return process.argv.includes(name);
}

function tenantFilter(tenantId?: string) {
  return tenantId ? { tenantId } : {};
}

function preservedDocumentClause() {
  return {
    $or: [
      { isActiveProfileDocument: true },
      { profileDocumentType: { $in: ["cv_resume", "cover_letter_template"] } },
      { type: { $in: PRESERVED_DOCUMENT_TYPES } },
      { kind: { $in: PRESERVED_DOCUMENT_TYPES } },
      { category: { $in: PRESERVED_DOCUMENT_TYPES } },
      { documentKind: { $in: ["CV"] } },
    ],
  };
}

function generatedDocumentClause() {
  return {
    $or: [
      { jobId: { $exists: true, $nin: [null, ""] } },
      { relatedJobId: { $exists: true, $nin: [null, ""] } },
      { aiGenerated: true },
      { type: { $in: GENERATED_DOCUMENT_TYPES } },
      { kind: { $in: GENERATED_DOCUMENT_TYPES } },
      { category: { $in: GENERATED_DOCUMENT_TYPES } },
      { documentKind: { $in: ["Research", "Cover Letter", "PDF Export"] } },
    ],
  };
}

function generatedDocumentFilter(tenantId?: string) {
  return {
    ...tenantFilter(tenantId),
    ...generatedDocumentClause(),
    $nor: [preservedDocumentClause()],
  };
}

async function resolveTenantId() {
  const explicit = process.env.ADMIN_RESET_TENANT_ID || process.env.TENANT_ID;
  if (explicit?.trim()) return explicit.trim();

  const tenants = await TenantModel.find({}).select("_id name").lean();
  if (tenants.length === 1) return String(tenants[0]._id);
  if (tenants.length === 0) return undefined;

  throw new Error("Multiple workspaces found. Set ADMIN_RESET_TENANT_ID to reset one workspace safely.");
}

async function existingRawCollections() {
  const db = mongoose.connection.db;
  if (!db) return [];

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const names = new Set(collections.map((collection) => collection.name));
  return RAW_OPERATIONAL_COLLECTIONS.filter((name) => names.has(name));
}

async function countRawCollections(collectionNames: string[], tenantId?: string) {
  const db = mongoose.connection.db;
  if (!db) return {};

  const entries = await Promise.all(
    collectionNames.map(async (name) => {
      const count = await db.collection(name).countDocuments(tenantFilter(tenantId));
      return [name, count] as const;
    })
  );
  return Object.fromEntries(entries);
}

async function deleteRawCollections(collectionNames: string[], tenantId?: string) {
  const db = mongoose.connection.db;
  if (!db) return {};

  const entries = await Promise.all(
    collectionNames.map(async (name) => {
      const result = await db.collection(name).deleteMany(tenantFilter(tenantId));
      return [name, result.deletedCount ?? 0] as const;
    })
  );
  return Object.fromEntries(entries);
}

async function countOperationalCollections(tenantId?: string) {
  const rawCollectionNames = await existingRawCollections();
  const [
    jobs,
    applications,
    interviews,
    generatedDocuments,
    reports,
    automationLogs,
    notifications,
    aiUsageLogs,
    rawQueueAndTempRecords,
  ] = await Promise.all([
    JobModel.countDocuments(tenantFilter(tenantId)),
    ApplicationModel.countDocuments(tenantFilter(tenantId)),
    InterviewModel.countDocuments(tenantFilter(tenantId)),
    DocumentModel.countDocuments(generatedDocumentFilter(tenantId)),
    ReportModel.countDocuments(tenantFilter(tenantId)),
    AutomationLogModel.countDocuments(tenantFilter(tenantId)),
    NotificationModel.countDocuments(tenantFilter(tenantId)),
    AiUsageLogModel.countDocuments(tenantFilter(tenantId)),
    countRawCollections(rawCollectionNames, tenantId),
  ]);

  return {
    jobs,
    applications,
    interviews,
    generatedDocuments,
    reports,
    automationLogs,
    notifications,
    aiUsageLogs,
    rawQueueAndTempRecords,
  };
}

async function countPreservedCollections(tenantId?: string) {
  const [
    users,
    workspaces,
    integrations,
    activeProfileDocuments,
    cvResumeDocuments,
    coverLetterTemplateDocuments,
    allPreservedDocuments,
  ] = await Promise.all([
    UserModel.countDocuments(tenantFilter(tenantId)),
    TenantModel.countDocuments(tenantId ? { _id: tenantId } : {}),
    IntegrationConnectionModel.countDocuments(tenantFilter(tenantId)),
    DocumentModel.countDocuments({ ...tenantFilter(tenantId), isActiveProfileDocument: true }),
    DocumentModel.countDocuments({
      ...tenantFilter(tenantId),
      $or: [
        { profileDocumentType: "cv_resume" },
        { type: { $in: ["cv", "CV", "resume", "Resume", "cv_resume", "master_cv"] } },
        { kind: { $in: ["cv", "resume", "cv_resume", "master_cv"] } },
        { category: { $in: ["cv", "resume", "cv_resume", "master_cv"] } },
      ],
    }),
    DocumentModel.countDocuments({
      ...tenantFilter(tenantId),
      $or: [
        { profileDocumentType: "cover_letter_template" },
        { type: { $in: ["cover_letter_template", "template", "Template"] } },
        { kind: { $in: ["cover_letter_template", "template"] } },
        { category: { $in: ["cover_letter_template", "template"] } },
      ],
    }),
    DocumentModel.countDocuments({
      ...tenantFilter(tenantId),
      ...preservedDocumentClause(),
    }),
  ]);

  return {
    users,
    workspaces,
    integrations,
    activeProfileDocuments,
    cvResumeDocuments,
    coverLetterTemplateDocuments,
    allPreservedDocuments,
  };
}

async function deleteOperationalCollections(tenantId?: string) {
  const rawCollectionNames = await existingRawCollections();
  const [
    jobs,
    applications,
    interviews,
    generatedDocuments,
    reports,
    automationLogs,
    notifications,
    aiUsageLogs,
    rawQueueAndTempRecords,
  ] = await Promise.all([
    JobModel.deleteMany(tenantFilter(tenantId)),
    ApplicationModel.deleteMany(tenantFilter(tenantId)),
    InterviewModel.deleteMany(tenantFilter(tenantId)),
    DocumentModel.deleteMany(generatedDocumentFilter(tenantId)),
    ReportModel.deleteMany(tenantFilter(tenantId)),
    AutomationLogModel.deleteMany(tenantFilter(tenantId)),
    NotificationModel.deleteMany(tenantFilter(tenantId)),
    AiUsageLogModel.deleteMany(tenantFilter(tenantId)),
    deleteRawCollections(rawCollectionNames, tenantId),
  ]);

  return {
    jobs: jobs.deletedCount ?? 0,
    applications: applications.deletedCount ?? 0,
    interviews: interviews.deletedCount ?? 0,
    generatedDocuments: generatedDocuments.deletedCount ?? 0,
    reports: reports.deletedCount ?? 0,
    automationLogs: automationLogs.deletedCount ?? 0,
    notifications: notifications.deletedCount ?? 0,
    aiUsageLogs: aiUsageLogs.deletedCount ?? 0,
    rawQueueAndTempRecords,
  };
}

function printSection(title: string, value: unknown) {
  console.log(`\n${title}`);
  console.log(JSON.stringify(value, null, 2));
}

function assertConfirmAllowed() {
  const confirmed = hasArg("--confirm");
  if (!confirmed) return false;

  const hasAdminToken = Boolean(process.env.ADMIN_RESET_TOKEN?.trim());
  const hasProductionConfirm = process.env.CONFIRM_PRODUCTION_RESET === "true";
  if (!hasAdminToken || !hasProductionConfirm) {
    throw new Error(
      "Refusing to delete. Real reset requires --confirm, ADMIN_RESET_TOKEN, and CONFIRM_PRODUCTION_RESET=true."
    );
  }

  return true;
}

async function main() {
  const confirmDelete = assertConfirmAllowed();
  const dryRun = hasArg("--dry-run") || !confirmDelete;

  await connectDatabase();
  const db = getDatabaseStatus();
  const tenantId = await resolveTenantId();

  console.log("NewJob Guru operational data reset");
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "(not set)"}`);
  console.log(`Connected database: ${db.name || "(unknown)"} @ ${db.host || "(unknown host)"}`);
  console.log(`Workspace scope: ${tenantId || "all workspaces"}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "CONFIRMED DELETE"}`);

  const before = await countOperationalCollections(tenantId);
  const preservedBefore = await countPreservedCollections(tenantId);
  printSection("Collection counts before reset", before);
  printSection("Preserved collection counts", preservedBefore);

  let deleted: CountMap | Record<string, unknown> = {};
  if (!dryRun) {
    deleted = await deleteOperationalCollections(tenantId);
  }

  const after = await countOperationalCollections(tenantId);
  const preservedAfter = await countPreservedCollections(tenantId);

  if (dryRun) {
    console.log("\nDry run only. No data was deleted.");
    console.log("Run with --confirm plus ADMIN_RESET_TOKEN and CONFIRM_PRODUCTION_RESET=true to delete operational data.");
  } else {
    printSection("Deleted counts", deleted);
  }

  printSection("Collection counts after reset", after);
  printSection("Preserved collection counts after reset", preservedAfter);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
