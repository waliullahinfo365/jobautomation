import { DocumentModel, JobModel } from "@jobflow/database/models";
import { documentApplicationEvent } from "@jobflow/database";
import { callAnthropicMessages, callAnthropicMessagesContent, buildAnthropicModelCandidates, resolveAnthropicApiKey } from "@jobflow/integrations/ai/anthropic-messages";
import {
  formatProfileContextBlock,
  loadWorkspaceProfileForPrompt,
} from "./workspace-profile.service";
import { exportDriveFile } from "./google-drive-export.service";
import { downloadFirebaseObject, firebaseStorageEnabled } from "./firebase-storage.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

const workspaceJobFilter = {
  $or: [{ jobId: { $exists: false } }, { jobId: null }, { jobId: "" }],
};

export type CoverLetterSource = "generated" | "template" | "legacy_template" | null;
export type ApplyDocumentDelivery = "firebase" | "drive" | "content_text";

type ResolvedApplyDoc = {
  documentId: string;
  fileName: string;
  delivery: ApplyDocumentDelivery;
  googleDriveFileId?: string;
  firebaseStoragePath?: string;
  contentText?: string;
};

type ResolvedCoverLetter = ResolvedApplyDoc & { source: Exclude<CoverLetterSource, null> };

function driveFileIdFromDoc(doc: Record<string, unknown>): string {
  return String(doc.googleDriveFileId ?? doc.driveFileId ?? "").trim();
}

function contentTextFromDoc(doc: Record<string, unknown>): string {
  return String(doc.contentText ?? "").trim();
}

function firebasePathFromDoc(doc: Record<string, unknown>): string {
  if (String(doc.storageProvider ?? "") !== "Firebase") return "";
  return String(doc.storagePath ?? "").trim();
}

function toResolvedDoc(row: Record<string, unknown>, defaultName: string): ResolvedApplyDoc | null {
  const documentId = String(row._id ?? "");
  if (!documentId) return null;
  const fileName = String(row.fileName ?? defaultName);
  const firebaseStoragePath = firebasePathFromDoc(row);
  if (firebaseStoragePath && firebaseStorageEnabled()) {
    return { documentId, fileName, delivery: "firebase", firebaseStoragePath, contentText: contentTextFromDoc(row) || undefined };
  }
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

  let firebasePick: ResolvedApplyDoc | null = null;
  let drivePick: ResolvedApplyDoc | null = null;
  let textPick: ResolvedApplyDoc | null = null;
  for (const raw of candidates) {
    const row = raw as Record<string, unknown>;
    const resolved = toResolvedDoc(row, defaultName);
    if (!resolved) continue;
    if (resolved.delivery === "firebase" && !firebasePick) firebasePick = resolved;
    if (resolved.delivery === "drive" && !drivePick) drivePick = resolved;
    if (resolved.delivery === "content_text" && !textPick) textPick = resolved;
    if (firebasePick && drivePick && textPick) break;
  }
  return firebasePick ?? drivePick ?? textPick;
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
      { storageProvider: "Firebase", storagePath: { $exists: true, $nin: [null, ""] } },
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
          firebaseStoragePath: cv.firebaseStoragePath,
        }
      : { available: false },
    coverLetter: coverLetter
      ? {
          available: true,
          documentId: coverLetter.documentId,
          fileName: coverLetter.fileName,
          delivery: coverLetter.delivery,
          googleDriveFileId: coverLetter.googleDriveFileId,
          firebaseStoragePath: coverLetter.firebaseStoragePath,
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
  if (delivery === "content_text") return `${stem}.txt`;
  if (delivery === "firebase") return baseName;
  return baseName.endsWith(".pdf") ? baseName : `${stem}.pdf`;
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

  if (doc.delivery === "firebase" && doc.firebaseStoragePath) {
    try {
      const downloaded = await downloadFirebaseObject(doc.firebaseStoragePath);
      return {
        buffer: downloaded.buffer,
        contentType: downloaded.contentType,
        fileName: streamFileName(doc.fileName, "firebase"),
        sizeBytes: downloaded.buffer.length,
        exportBranch: "firebase" as const,
        sourceMimeType: downloaded.contentType,
        documentId: doc.documentId,
        coverLetterSource,
        delivery: "firebase" as const,
      };
    } catch {
      // Fall through to text / Drive if Firebase read fails
    }
  }

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

const COMPLETE_STATUSES = ["Applied", "In Progress", "Rejected", "Interview"] as const;
export type ApplyCompleteStatus = (typeof COMPLETE_STATUSES)[number];

export const APPLY_ANSWER_COMPACT_MAX_CHARS = 500;
export const APPLY_ANSWER_MIN_CHARS = 50;
export const APPLY_ANSWER_MAX_CHARS = 2000;
export type ApplyAnswerVariant = "full" | "compact";

const SCREENSHOT_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function resolveAnswerMaxCharacters(input: {
  variant?: ApplyAnswerVariant;
  maxCharacters?: number;
}): number | null {
  if (input.variant !== "compact") return null;
  const raw = input.maxCharacters;
  if (raw == null || Number.isNaN(raw)) return APPLY_ANSWER_COMPACT_MAX_CHARS;
  const n = Math.floor(Number(raw));
  if (n < APPLY_ANSWER_MIN_CHARS || n > APPLY_ANSWER_MAX_CHARS) {
    throw new ApiError(
      `maxCharacters must be between ${APPLY_ANSWER_MIN_CHARS} and ${APPLY_ANSWER_MAX_CHARS}`,
      400,
      "VALIDATION_ERROR"
    );
  }
  return n;
}

function enforceCompactLength(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.7) return `${slice.slice(0, lastSpace).trim()}…`;
  return `${slice.trim()}…`;
}

function parseQuestionsJson(raw: string): string[] {
  const stripped = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(stripped) as { questions?: unknown };
  if (!Array.isArray(parsed.questions)) return [];
  return parsed.questions
    .map((q) => (typeof q === "string" ? q.trim() : ""))
    .filter(Boolean)
    .slice(0, 12);
}

async function loadApplyAnswerContext(tenantId: string, userId: string, jobId: string) {
  const job = (await findTenantScopedById(JobModel, tenantId, jobId)) as Record<string, unknown> | null;
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");
  const profile = await loadWorkspaceProfileForPrompt(tenantId, userId);
  const profileBlock = formatProfileContextBlock(profile);
  const description = String(job.description ?? job.aiSummary ?? "").trim();
  return { job, profileBlock, description };
}

function buildAnswerPrompt(input: {
  job: Record<string, unknown>;
  profileBlock: string;
  description: string;
  question: string;
  variant: ApplyAnswerVariant;
  maxCharacters: number | null;
}) {
  const lengthRule =
    input.variant === "compact" && input.maxCharacters
      ? `Length: maximum ${input.maxCharacters} characters (letters and spaces). Stay under this hard limit. Be concise and direct.`
      : "Length: 150–300 words.";

  return [
    "Write a job application answer for the candidate.",
    lengthRule,
    "First person. Professional tone. No markdown.",
    "",
    `Company: ${String(input.job.company ?? "")}`,
    `Role: ${String(input.job.position ?? input.job.title ?? "")}`,
    input.description ? `Job description:\n${input.description.slice(0, 6000)}` : "",
    input.profileBlock,
    "",
    `Application question:\n${input.question}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function callApplyAnswerAi(prompt: string, variant: ApplyAnswerVariant, maxCharacters: number | null) {
  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) throw new ApiError("AI is not configured", 503, "AI_NOT_CONFIGURED");

  const compactMax = variant === "compact" ? maxCharacters ?? APPLY_ANSWER_COMPACT_MAX_CHARS : null;
  const maxTokens =
    compactMax != null ? Math.min(900, Math.max(120, Math.ceil(compactMax / 2) + 40)) : 900;

  const result = await callAnthropicMessages({
    prompt,
    apiKey,
    modelCandidates: buildAnthropicModelCandidates(),
    maxTokens,
    temperature: 0.4,
  });
  if (!result.ok) throw new ApiError(result.message ?? "AI call failed", 502, "AI_FAILED");

  let answer = result.text.trim();
  if (!answer) throw new ApiError("AI returned an empty answer", 502, "AI_EMPTY");
  if (compactMax != null) answer = enforceCompactLength(answer, compactMax);
  return answer;
}

export async function generateApplyAnswer(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  questionText: string;
  variant?: ApplyAnswerVariant;
  maxCharacters?: number;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const question = input.questionText.trim();
  if (!question) throw new ApiError("questionText is required", 400, "VALIDATION_ERROR");

  const variant = input.variant ?? "compact";
  const maxCharacters = resolveAnswerMaxCharacters({ variant, maxCharacters: input.maxCharacters });
  const { job, profileBlock, description } = await loadApplyAnswerContext(tenantId, input.userId, input.jobId);
  const prompt = buildAnswerPrompt({ job, profileBlock, description, question, variant, maxCharacters });
  const answer = await callApplyAnswerAi(prompt, variant, maxCharacters);

  return {
    answer,
    aiGenerated: true,
    variant,
    maxCharacters: maxCharacters ?? undefined,
    characterCount: answer.length,
  };
}

export async function generateApplyAnswersFromScreenshot(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  imageBase64: string;
  mediaType?: string;
  variant?: ApplyAnswerVariant;
  maxCharacters?: number;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const rawBase64 = input.imageBase64.trim();
  if (!rawBase64) throw new ApiError("imageBase64 is required", 400, "VALIDATION_ERROR");
  if (rawBase64.length > 7_000_000) {
    throw new ApiError("Screenshot is too large (max ~5MB)", 400, "VALIDATION_ERROR");
  }

  const mediaType = (input.mediaType?.trim() || "image/png").toLowerCase();
  if (!SCREENSHOT_MEDIA_TYPES.has(mediaType)) {
    throw new ApiError("Unsupported image type. Use JPEG, PNG, WebP, or GIF.", 400, "VALIDATION_ERROR");
  }

  const variant = input.variant ?? "compact";
  const maxCharacters = resolveAnswerMaxCharacters({ variant, maxCharacters: input.maxCharacters });
  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) throw new ApiError("AI is not configured", 503, "AI_NOT_CONFIGURED");

  const { job, profileBlock, description } = await loadApplyAnswerContext(tenantId, input.userId, input.jobId);

  const extractResult = await callAnthropicMessagesContent({
    apiKey,
    modelCandidates: buildAnthropicModelCandidates(),
    maxTokens: 1200,
    temperature: 0.1,
    content: [
      {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: rawBase64 },
      },
      {
        type: "text",
        text: [
          "This screenshot shows a job application form.",
          "Extract every distinct application question visible (ignore labels like Submit, Next, or file upload buttons).",
          'Return ONLY valid JSON: {"questions":["question one","question two"]}.',
          "Preserve question wording. If none found, return {\"questions\":[]}.",
        ].join("\n"),
      },
    ],
  });
  if (!extractResult.ok) throw new ApiError(extractResult.message ?? "Could not read screenshot", 502, "AI_FAILED");

  let questions: string[];
  try {
    questions = parseQuestionsJson(extractResult.text);
  } catch {
    throw new ApiError("Could not parse questions from screenshot", 502, "AI_PARSE_FAILED");
  }
  if (!questions.length) {
    throw new ApiError("No application questions found in the screenshot", 422, "NO_QUESTIONS_FOUND");
  }

  const items: Array<{ question: string; answer: string; characterCount: number; maxCharacters?: number }> = [];
  for (const question of questions) {
    const prompt = buildAnswerPrompt({ job, profileBlock, description, question, variant, maxCharacters });
    const answer = await callApplyAnswerAi(prompt, variant, maxCharacters);
    items.push({
      question,
      answer,
      characterCount: answer.length,
      ...(maxCharacters ? { maxCharacters } : {}),
    });
  }

  return {
    items,
    variant,
    maxCharacters: maxCharacters ?? undefined,
    aiGenerated: true,
    questionCount: items.length,
  };
}

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
