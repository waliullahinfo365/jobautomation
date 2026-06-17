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

type ResolvedDoc = {
  documentId: string;
  googleDriveFileId: string;
  fileName: string;
};

export type CoverLetterSource = "generated" | "template" | "legacy_template" | null;

type ResolvedCoverLetter = ResolvedDoc & { source: Exclude<CoverLetterSource, null> };

function driveFileIdFromDoc(doc: Record<string, unknown>): string {
  return String(doc.googleDriveFileId ?? doc.driveFileId ?? "").trim();
}

async function resolveActiveCvDocument(tenantId: string, userId: string): Promise<ResolvedDoc | null> {
  const base = {
    tenantId,
    profileDocumentType: "cv_resume",
    isActiveProfileDocument: true,
    ...workspaceJobFilter,
    googleDriveFileId: { $exists: true, $nin: [null, ""] },
  };
  let doc =
    (await DocumentModel.findOne({ ...base, createdBy: userId }).sort({ updatedAt: -1 }).lean()) ??
    (await DocumentModel.findOne(base).sort({ updatedAt: -1 }).lean());
  if (!doc) {
    const legacy = await DocumentModel.findOne({
      tenantId,
      type: "CV",
      ...workspaceJobFilter,
      googleDriveFileId: { $exists: true, $nin: [null, ""] },
    })
      .sort({ updatedAt: -1 })
      .lean();
    doc = legacy;
  }
  if (!doc) return null;
  const row = doc as Record<string, unknown>;
  const googleDriveFileId = driveFileIdFromDoc(row);
  if (!googleDriveFileId) return null;
  return {
    documentId: String(row._id),
    googleDriveFileId,
    fileName: String(row.fileName ?? "cv.pdf"),
  };
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
    const googleDriveFileId = generated ? driveFileIdFromDoc(generated) : "";
    if (googleDriveFileId) {
      return {
        documentId: generatedId,
        googleDriveFileId,
        fileName: String(generated?.fileName ?? "cover-letter.pdf"),
        source: "generated",
      };
    }
  }

  const templateBase = {
    tenantId,
    profileDocumentType: "cover_letter_template",
    isActiveProfileDocument: true,
    ...workspaceJobFilter,
    googleDriveFileId: { $exists: true, $nin: [null, ""] },
  };
  let doc =
    (await DocumentModel.findOne({ ...templateBase, createdBy: userId }).sort({ updatedAt: -1 }).lean()) ??
    (await DocumentModel.findOne(templateBase).sort({ updatedAt: -1 }).lean());
  if (doc) {
    const row = doc as Record<string, unknown>;
    const googleDriveFileId = driveFileIdFromDoc(row);
    if (googleDriveFileId) {
      return {
        documentId: String(row._id),
        googleDriveFileId,
        fileName: String(row.fileName ?? "cover-letter.pdf"),
        source: "template",
      };
    }
  }

  doc = await DocumentModel.findOne({
    tenantId,
    type: "Cover Letter",
    ...workspaceJobFilter,
    googleDriveFileId: { $exists: true, $nin: [null, ""] },
  })
    .sort({ updatedAt: -1 })
    .lean();
  if (!doc) return null;
  const row = doc as Record<string, unknown>;
  const googleDriveFileId = driveFileIdFromDoc(row);
  if (!googleDriveFileId) return null;
  return {
    documentId: String(row._id),
    googleDriveFileId,
    fileName: String(row.fileName ?? "cover-letter.pdf"),
    source: "legacy_template",
  };
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
}): Promise<ResolvedDoc> {
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
        ? "No CV linked to Google Drive. Upload an active CV in Documents first."
        : "No cover letter linked to Google Drive for this job.",
      404,
      "DRIVE_DOCUMENT_NOT_FOUND"
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
      ? { available: true, documentId: cv.documentId, fileName: cv.fileName, googleDriveFileId: cv.googleDriveFileId }
      : { available: false },
    coverLetter: coverLetter
      ? {
          available: true,
          documentId: coverLetter.documentId,
          fileName: coverLetter.fileName,
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
  const exported = await exportDriveFile({
    tenantId: input.tenantId,
    googleDriveFileId: doc.googleDriveFileId,
    preferredFileName: doc.fileName,
    exportMimeType: "application/pdf",
  });
  return { ...exported, documentId: doc.documentId, coverLetterSource };
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
