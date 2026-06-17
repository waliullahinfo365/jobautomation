import { DocumentModel, JobModel } from "@jobflow/database/models";
import { documentApplicationEvent } from "@jobflow/database";
import { callAnthropicMessages, buildAnthropicModelCandidates, resolveAnthropicApiKey } from "@jobflow/integrations/ai/anthropic-messages";
import {
  formatProfileContextBlock,
  loadWorkspaceProfileForPrompt,
} from "./workspace-profile.service";
import { exportDriveFile } from "./google-drive-export.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

const workspaceJobFilter = {
  $or: [{ jobId: { $exists: false } }, { jobId: null }, { jobId: "" }],
};

export type CoverLetterSource = "generated" | "template" | "legacy_template" | null;
export type ApplyDocumentDelivery = "drive" | "content_text";

type ResolvedApplyDoc = {
  documentId: string;
  fileName: string;
  delivery: ApplyDocumentDelivery;
  googleDriveFileId?: string;
  contentText?: string;
};

type ResolvedCoverLetter = ResolvedApplyDoc & { source: Exclude<CoverLetterSource, null> };

function driveFileIdFromDoc(doc: Record<string, unknown>): string {
  return String(doc.googleDriveFileId ?? doc.driveFileId ?? "").trim();
}

function contentTextFromDoc(doc: Record<string, unknown>): string {
  return String(doc.contentText ?? "").trim();
}

function toResolvedDoc(row: Record<string, unknown>, defaultName: string): ResolvedApplyDoc | null {
  const documentId = String(row._id ?? "");
  if (!documentId) return null;
  const fileName = String(row.fileName ?? defaultName);
  const googleDriveFileId = driveFileIdFromDoc(row);
  if (googleDriveFileId) {
    return { documentId, fileName, delivery: "drive", googleDriveFileId };
  }
  const contentText = contentTextFromDoc(row);
  if (contentText) {
    return { documentId, fileName, delivery: "content_text", contentText };
  }
  return null;
}

async function findWorkspaceProfileDoc(
  tenantId: string,
  userId: string,
  profileDocumentType: "cv_resume" | "cover_letter_template",
  legacyType: "CV" | "Cover Letter",
  defaultName: string
): Promise<ResolvedApplyDoc | null> {
  const activeBase = {
    tenantId,
    profileDocumentType,
    isActiveProfileDocument: true,
    ...workspaceJobFilter,
  };
  const candidates: unknown[] = [];
  for (const query of [
    { ...activeBase, createdBy: userId },
    activeBase,
    { tenantId, type: legacyType, ...workspaceJobFilter, createdBy: userId },
    { tenantId, type: legacyType, ...workspaceJobFilter },
  ]) {
    const doc = await DocumentModel.findOne(query).sort({ updatedAt: -1 }).lean();
    if (doc) candidates.push(doc);
  }

  let drivePick: ResolvedApplyDoc | null = null;
  let textPick: ResolvedApplyDoc | null = null;
  for (const raw of candidates) {
    const row = raw as Record<string, unknown>;
    const resolved = toResolvedDoc(row, defaultName);
    if (!resolved) continue;
    if (resolved.delivery === "drive" && !drivePick) drivePick = resolved;
    if (resolved.delivery === "content_text" && !textPick) textPick = resolved;
    if (drivePick && textPick) break;
  }
  return drivePick ?? textPick;
}

async function resolveActiveCvDocument(tenantId: string, userId: string): Promise<ResolvedApplyDoc | null> {
  return findWorkspaceProfileDoc(tenantId, userId, "cv_resume", "CV", "cv.txt");
}

async function resolveCoverLetterDocument(
  tenantId: string,
  userId: string,
  jobId: string
): Promise<ResolvedCoverLetter | null> {
  const job = (await JobModel.findOne({ _id: jobId, tenantId }).lean()) as Record<string, unknown> | null;
  const generatedId = String(job?.generatedCoverLetterDocumentId ?? "").trim();
  if (generatedId) {
    const generated = (await DocumentModel.findOne({ _id: generatedId, tenantId }).lean()) as Record<string, unknown> | null;
    const resolved = generated ? toResolvedDoc(generated, "cover-letter.txt") : null;
    if (resolved) return { ...resolved, source: "generated" };
  }

  const template = await findWorkspaceProfileDoc(
    tenantId,
    userId,
    "cover_letter_template",
    "Cover Letter",
    "cover-letter.txt"
  );
  if (template) return { ...template, source: "template" };

  const jobCover = await DocumentModel.findOne({
    tenantId,
    jobId,
    type: "Cover Letter",
    $or: [
      { googleDriveFileId: { $exists: true, $nin: [null, ""] } },
      { driveFileId: { $exists: true, $nin: [null, ""] } },
      { contentText: { $exists: true, $nin: [null, ""] } },
    ],
  })
    .sort({ updatedAt: -1 })
    .lean();
  const jobCoverResolved = jobCover ? toResolvedDoc(jobCover as Record<string, unknown>, "cover-letter.txt") : null;
  if (jobCoverResolved) return { ...jobCoverResolved, source: "generated" };

  const legacy = await DocumentModel.findOne({
    tenantId,
    type: "Cover Letter",
    ...workspaceJobFilter,
  })
    .sort({ updatedAt: -1 })
    .lean();
  const legacyResolved = legacy ? toResolvedDoc(legacy as Record<string, unknown>, "cover-letter.txt") : null;
  if (legacyResolved) return { ...legacyResolved, source: "legacy_template" };

  return null;
}

async function resolveApplyDocumentReferenceIds(
  tenantId: string,
  userId: string,
  jobId: string
): Promise<string[]> {
  const ids: string[] = [];
  const cv = await resolveActiveCvDocument(tenantId, userId);
  if (cv) ids.push(cv.documentId);
  const cover = await resolveCoverLetterDocument(tenantId, userId, jobId);
  if (cover) ids.push(cover.documentId);
  return ids;
}

export async function resolveApplyDocument(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  role: "cv" | "cover_letter";
}): Promise<ResolvedApplyDoc> {
  const tenantId = assertTenantId(input.tenantId);
  const job = await findTenantScopedById(JobModel, tenantId, input.jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const resolved =
    input.role === "cv"
      ? await resolveActiveCvDocument(tenantId, input.userId)
      : await resolveCoverLetterDocument(tenantId, input.userId, input.jobId);

  if (!resolved) {
    throw new ApiError(
      input.role === "cv"
        ? "No CV found. Upload an active CV in Documents first."
        : "No cover letter found for this job. Upload a template or generate one.",
      404,
      "APPLY_DOCUMENT_NOT_FOUND"
    );
  }
  return resolved;
}

export async function getApplyDocumentStatus(input: {
  tenantId: string;
  userId: string;
  jobId: string;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const job = await findTenantScopedById(JobModel, tenantId, input.jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const cv = await resolveActiveCvDocument(tenantId, input.userId);
  const coverLetter = await resolveCoverLetterDocument(tenantId, input.userId, input.jobId);
  const jobRow = job as Record<string, unknown>;

  return {
    cv: cv
      ? {
          available: true,
          documentId: cv.documentId,
          fileName: cv.fileName,
          delivery: cv.delivery,
          googleDriveFileId: cv.googleDriveFileId,
        }
      : { available: false },
    coverLetter: coverLetter
      ? {
          available: true,
          documentId: coverLetter.documentId,
          fileName: coverLetter.fileName,
          delivery: coverLetter.delivery,
          googleDriveFileId: coverLetter.googleDriveFileId,
          source: coverLetter.source,
        }
      : {
          available: false,
          source: null as CoverLetterSource,
          generatedCoverLetterDocumentId: String(jobRow.generatedCoverLetterDocumentId ?? "").trim() || null,
        },
    missingDocuments: {
      cv: !cv,
      coverLetter: !coverLetter,
    },
  };
}

function streamFileName(baseName: string, delivery: ApplyDocumentDelivery): string {
  const stem = baseName.replace(/\.[^.]+$/, "") || baseName;
  return delivery === "content_text" ? `${stem}.txt` : baseName.endsWith(".pdf") ? baseName : `${stem}.pdf`;
}

export async function streamApplyDocument(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  role: "cv" | "cover_letter";
}) {
  const doc = await resolveApplyDocument(input);
  const coverLetterSource =
    input.role === "cover_letter"
      ? ((await resolveCoverLetterDocument(input.tenantId, input.userId, input.jobId))?.source ?? null)
      : null;

  if (doc.delivery === "drive" && doc.googleDriveFileId) {
    const exported = await exportDriveFile({
      tenantId: input.tenantId,
      googleDriveFileId: doc.googleDriveFileId,
      preferredFileName: doc.fileName,
      exportMimeType: "application/pdf",
    });
    return { ...exported, documentId: doc.documentId, coverLetterSource, delivery: "drive" as const };
  }

  const text = doc.contentText?.trim();
  if (!text) {
    throw new ApiError("Document has no exportable content", 404, "APPLY_DOCUMENT_EMPTY");
  }
  const buffer = Buffer.from(text, "utf8");
  const fileName = streamFileName(doc.fileName, "content_text");
  return {
    buffer,
    contentType: "text/plain; charset=utf-8",
    fileName,
    sizeBytes: buffer.length,
    exportBranch: "content_text" as const,
    sourceMimeType: "text/plain",
    documentId: doc.documentId,
    coverLetterSource,
    delivery: "content_text" as const,
  };
}

export async function generateApplyAnswer(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  questionText: string;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const job = (await findTenantScopedById(JobModel, tenantId, input.jobId)) as Record<string, unknown> | null;
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const question = input.questionText.trim();
  if (!question) throw new ApiError("questionText is required", 400, "VALIDATION_ERROR");

  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) throw new ApiError("AI is not configured", 503, "AI_NOT_CONFIGURED");

  const profile = await loadWorkspaceProfileForPrompt(tenantId, input.userId);
  const profileBlock = formatProfileContextBlock(profile);
  const description = String(job.description ?? job.aiSummary ?? "").trim();

  const prompt = [
    "Write a job application answer for the candidate.",
    "Length: 150–300 words. First person. Professional tone. No markdown.",
    "",
    `Company: ${String(job.company ?? "")}`,
    `Role: ${String(job.position ?? job.title ?? "")}`,
    description ? `Job description:\n${description.slice(0, 6000)}` : "",
    profileBlock,
    "",
    `Application question:\n${question}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await callAnthropicMessages({
    prompt,
    apiKey,
    modelCandidates: buildAnthropicModelCandidates(),
    maxTokens: 900,
    temperature: 0.4,
  });
  if (!result.ok) throw new ApiError(result.message ?? "AI call failed", 502, "AI_FAILED");

  const answer = result.text.trim();
  if (!answer) throw new ApiError("AI returned an empty answer", 502, "AI_EMPTY");

  return { answer, aiGenerated: true };
}

const COMPLETE_STATUSES = ["Applied", "In Progress", "Rejected", "Interview"] as const;
export type ApplyCompleteStatus = (typeof COMPLETE_STATUSES)[number];

export async function completeApplyAssistant(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  status: ApplyCompleteStatus;
  notes?: string;
  followUpDate?: Date;
  proofDocumentId?: string;
  documentIds?: string[];
}) {
  const tenantId = assertTenantId(input.tenantId);
  if (!COMPLETE_STATUSES.includes(input.status)) {
    throw new ApiError(`Invalid status: ${input.status}`, 400, "VALIDATION_ERROR");
  }

  const job = await findTenantScopedById(JobModel, tenantId, input.jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const resolvedIds = await resolveApplyDocumentReferenceIds(tenantId, input.userId, input.jobId);
  const explicitIds = input.documentIds?.map((id) => id.trim()).filter(Boolean) ?? [];
  const proofId = input.proofDocumentId?.trim();
  const merged = [...new Set([...resolvedIds, ...explicitIds, ...(proofId ? [proofId] : [])])];
  const documentIds = merged.length ? merged : undefined;
  const appliedAt = input.status === "Applied" || input.status === "Interview" ? new Date() : undefined;

  const application = await documentApplicationEvent({
    tenantId,
    userId: input.userId,
    jobId: input.jobId,
    applicationStatus: input.status,
    applyMethod: "manual_assistant",
    appliedAt,
    notes: input.notes,
    followUpDate: input.followUpDate,
    documentIds,
    company: String(job.company ?? ""),
    position: String(job.position ?? job.title ?? ""),
  });

  return application;
}
