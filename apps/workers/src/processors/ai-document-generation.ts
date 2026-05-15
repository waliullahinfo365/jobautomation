import { AutomationLogModel, DocumentModel, JobModel, TenantModel, UserModel } from "@jobflow/database/models";
import {
  buildAnthropicModelCandidates,
  callAnthropicMessages,
  resolveAnthropicApiKey,
} from "@jobflow/integrations/ai/anthropic-messages";
import { formatProfileContextBlock, loadWorkspaceProfileForPrompt } from "../lib/workspace-profile-docs";
import { loadGoogleAccessToken } from "../lib/google-auth";
import { createGoogleDoc, ensureWorkspaceFolderStructure, findOrCreateFolder } from "../lib/google-drive";
import { GOOGLE_DRIVE_DOCS_WORKER_SCOPES } from "@jobflow/shared/constants/googleScopes";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";
import { redactForLog, serializeWorkerError } from "../utils/worker-error";

type JobContext = {
  tenantId: string;
  userId: string;
  operationId: string;
  jobId: string;
  company: string;
  position: string;
  description?: string;
  location?: string;
  tenantName?: string;
  userName?: string;
};

type ClaudeResult = {
  text: string;
  model: string;
};

function toId(value: unknown): string {
  return String(value ?? "");
}

function sanitizeTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function loadJobContext(input: {
  tenantId: string;
  userId: string;
  operationId?: string;
  jobId: string;
}): Promise<JobContext> {
  let job: Record<string, unknown> | null = null;
  try {
    job = (await JobModel.findOne({ tenantId: input.tenantId, _id: input.jobId }).lean()) as Record<string, unknown> | null;
  } catch {
    throw new Error(`Job not found for AI processing: ${input.jobId}`);
  }
  if (!job) {
    throw new Error(`Job not found for AI processing: ${input.jobId}`);
  }

  let tenantName: string | undefined;
  try {
    const tenant = await TenantModel.findById(input.tenantId).select("name").lean();
    tenantName = (tenant as { name?: string } | null)?.name;
  } catch {
    tenantName = undefined;
  }

  let userName: string | undefined;
  try {
    const user = await UserModel.findOne({ tenantId: input.tenantId, _id: input.userId }).select("name").lean();
    userName = (user as { name?: string } | null)?.name;
  } catch {
    userName = undefined;
  }

  return {
    tenantId: input.tenantId,
    userId: input.userId,
    operationId: input.operationId ?? `op-${Date.now()}`,
    jobId: input.jobId,
    company: String(job.company ?? "Unknown Company"),
    position: String(job.position ?? "Unknown Position"),
    description: (job.description as string | undefined) ?? undefined,
    location: (job.location as string | undefined) ?? undefined,
    tenantName,
    userName,
  };
}

async function writeAutomationLog(input: {
  tenantId: string;
  moduleKey: string;
  status: "Success" | "Warning" | "Failed" | "Running";
  message: string;
  operationId: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}) {
  try {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      createdBy: "system",
      moduleKey: input.moduleKey,
      moduleName: input.moduleKey,
      status: input.status,
      message: input.message,
      operationId: input.operationId,
      relatedRecordType: input.relatedRecordType,
      relatedRecordId: input.relatedRecordId,
      metadata: input.metadata ?? {},
      error: input.error,
      durationMs: input.durationMs,
    });
  } catch (e) {
    logger.error({ err: e, moduleKey: input.moduleKey, operationId: input.operationId }, "failed to persist automation log");
  }
}


/**
 * Calls Claude and returns the text result.
 * Throws with a clean error message if the API key is missing or the call fails —
 * callers must mark the job Failed and rethrow; no fake content is produced.
 */
async function generateWithClaude(input: {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ClaudeResult> {
  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Cannot generate AI content without a valid API key.");
  }

  const modelCandidates = buildAnthropicModelCandidates();

  try {
    const result = await callAnthropicMessages({
      prompt: input.prompt,
      apiKey,
      modelCandidates,
      maxTokens: input.maxTokens ?? 1500,
      temperature: input.temperature ?? 0.2,
    });

    if (result.ok) {
      logger.info({ model: result.model }, "anthropic messages success");
      return { text: result.text, model: result.model };
    }

    const summary = `[${result.errorType}] ${redactForLog(result.message, 400)}${result.status != null ? ` (status ${result.status})` : ""} model=${result.modelAttempted}`;
    if (result.errorType === "model_not_found") {
      logger.warn({ modelAttempted: result.modelAttempted }, "Anthropic model not found. Check ANTHROPIC_MODEL env.");
    } else {
      logger.warn({ errorType: result.errorType, status: result.status, modelAttempted: result.modelAttempted }, "anthropic messages failed");
    }
    throw new Error(`Claude API error: ${summary}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Claude API error:")) throw error;
    const ser = serializeWorkerError(error);
    throw new Error(`Claude API network error: ${redactForLog(`${ser.name ?? "Error"}: ${ser.message}`)}`);
  }
}

function generationLogMeta(
  jobId: string,
  model: string,
  extra: Record<string, unknown>
): Record<string, unknown> {
  return { jobId, model, ...extra };
}

async function persistDocument(docPayload: Record<string, unknown>) {
  try {
    return await DocumentModel.create(docPayload);
  } catch (error) {
    const ser = serializeWorkerError(error);
    throw new Error(`Failed to save document: ${redactForLog(ser.message)}`);
  }
}

async function routeGeneratedDocToDrive(input: {
  tenantId: string;
  jobId: string;
  fileName: string;
  content: string;
  preferredFolderId?: string;
  fallbackFolder: "research" | "cover-letter" | "ai-drafts";
}) {
  const auth = await loadGoogleAccessToken({
    tenantId: input.tenantId,
    provider: "Google Drive",
    requiredScopes: [...GOOGLE_DRIVE_DOCS_WORKER_SCOPES],
  });
  if (!auth.connected) return { ok: false as const, reason: auth.reason };
  const job = await JobModel.findOne({ tenantId: input.tenantId, _id: input.jobId }).lean();
  const workspace = await ensureWorkspaceFolderStructure({
    tenantId: input.tenantId,
    accessToken: auth.accessToken,
  });
  let parentId = input.preferredFolderId;
  let storageLocation = "";
  if (!parentId && job) {
    if (input.fallbackFolder === "research") {
      parentId = String((job as Record<string, unknown>).researchFolderId ?? "");
      storageLocation = `Job Applications/Applications/${String((job as Record<string, unknown>).company ?? "Company")} ${String((job as Record<string, unknown>).position ?? "Position")}/Research`;
    } else if (input.fallbackFolder === "cover-letter") {
      parentId = String((job as Record<string, unknown>).coverLetterFolderId ?? "");
      storageLocation = `Job Applications/Applications/${String((job as Record<string, unknown>).company ?? "Company")} ${String((job as Record<string, unknown>).position ?? "Position")}/Cover Letter`;
    } else {
      parentId = workspace.aiDrafts.folder.id;
      storageLocation = "Job Applications/AI Drafts";
    }
  }
  if (!parentId) {
    const company = String((job as Record<string, unknown> | null)?.company ?? "Company");
    const position = String((job as Record<string, unknown> | null)?.position ?? "Position");
    const jobFolder = await findOrCreateFolder({
      accessToken: auth.accessToken,
      name: `${company} ${position}`,
      parentId: workspace.applications.folder.id,
    });
    const sectionName = input.fallbackFolder === "research" ? "Research" : "Cover Letter";
    const section = await findOrCreateFolder({
      accessToken: auth.accessToken,
      name: sectionName,
      parentId: jobFolder.folder.id,
    });
    parentId = section.folder.id;
    storageLocation = `Job Applications/Applications/${company} ${position}/${sectionName}`;
  }
  if (!storageLocation && input.fallbackFolder === "ai-drafts") storageLocation = "Job Applications/AI Drafts";

  const doc = await createGoogleDoc({
    accessToken: auth.accessToken,
    name: input.fileName,
    content: input.content,
    parentId,
  });
  return {
    ok: true as const,
    googleDocId: doc.id,
    googleDocUrl: doc.webViewLink ?? `https://docs.google.com/document/d/${doc.id}/edit`,
    parentId,
    storageLocation,
  };
}

const suppressFlag = { suppressWorkerCompletionLog: true as const };

interface ResearchJson {
  company_overview: string;
  role_summary: string;
  candidate_match: string;
  possible_gaps: string;
  talking_points: string[];
  interview_questions: string[];
  application_strategy: string;
  sources_note: string;
}

function formatResearchAsText(r: ResearchJson, ctx: JobContext): string {
  return [
    `# Research Brief — ${ctx.company} — ${ctx.position}`,
    "",
    "## Company Overview",
    r.company_overview,
    "",
    "## Role Summary",
    r.role_summary,
    "",
    "## Candidate Match",
    r.candidate_match,
    "",
    "## Possible Gaps",
    r.possible_gaps,
    "",
    "## Talking Points",
    ...r.talking_points.map((p) => `- ${p}`),
    "",
    "## Interview Questions",
    ...r.interview_questions.map((q) => `- ${q}`),
    "",
    "## Application Strategy",
    r.application_strategy,
    "",
    "## Sources Note",
    r.sources_note,
  ].join("\n");
}

function parseResearchJson(text: string): ResearchJson | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned) as ResearchJson;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as ResearchJson; } catch { return null; }
    }
    return null;
  }
}

export async function createResearchDocument(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  operationId?: string;
}) {
  const started = Date.now();
  const ctx = await loadJobContext(input);
  const profile = await loadWorkspaceProfileForPrompt(ctx.tenantId, ctx.userId);
  const profileBlock = formatProfileContextBlock(profile);
  const title = sanitizeTitle(`Research — ${ctx.company} — ${ctx.position}`);

  const prompt = [
    "You are a career research assistant. Output ONLY valid JSON — no markdown, no commentary.",
    "Return a single JSON object with exactly these keys:",
    '  "company_overview": string — 2-4 sentences about the company based on the job description',
    '  "role_summary": string — what the role entails and its place in the org',
    '  "candidate_match": string — how a strong candidate would match this role',
    '  "possible_gaps": string — skills or experience the JD requires that may be challenging',
    '  "talking_points": array of 4-6 string bullet points for interviews or networking',
    '  "interview_questions": array of 5-7 likely interview questions for this role',
    '  "application_strategy": string — 2-3 sentences on how to tailor the application',
    '  "sources_note": string — note that analysis is based solely on the provided job description',
    "",
    "Base analysis ONLY on the job description provided. Do not invent facts.",
    "",
    `Company: ${ctx.company}`,
    `Position: ${ctx.position}`,
    `Location: ${ctx.location ?? "Not specified"}`,
    `Job description:\n${ctx.description ?? "Not provided"}`,
    ...(profileBlock ? ["", profileBlock, "", "When CV data is provided, align candidate_match with real skills from the CV."] : []),
  ].join("\n");

  let generated: ClaudeResult;
  try {
    generated = await generateWithClaude({ prompt, maxTokens: 1800, temperature: 0.2 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Claude generation failed";
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "research-document",
      status: "Failed",
      message: `Research generation failed: ${redactForLog(errorMessage, 300)}`,
      operationId: ctx.operationId,
      relatedRecordType: "Job",
      relatedRecordId: ctx.jobId,
      metadata: { source: "worker:research-document" },
    });
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Failed",
      aiProcessingError: "Research generation failed. Check AI configuration.",
      aiProcessingCompletedAt: new Date(),
    });
    throw error;
  }

  const parsed = parseResearchJson(generated.text);
  const docText = parsed ? formatResearchAsText(parsed, ctx) : generated.text;

  const doc = await persistDocument({
    tenantId: ctx.tenantId,
    createdBy: ctx.userId,
    jobId: ctx.jobId,
    fileName: title,
    type: "Research",
    status: "Ready",
    documentKind: "Research",
    generationStatus: "Generated",
    aiGenerated: true,
    aiProvider: "Claude",
    aiModel: generated.model,
    contentText: docText,
    metadata: {
      operationId: ctx.operationId,
      source: "worker:research-document",
      model: generated.model,
      generatedAt: new Date().toISOString(),
      usedWorkspaceProfile: Boolean(profile.cvText || profile.coverLetterStyleText || profile.portfolioText),
      ...(parsed ? { structuredData: parsed } : {}),
    },
  });

  let driveRoute:
    | { ok: true; googleDocId: string; googleDocUrl: string; parentId?: string; storageLocation?: string }
    | { ok: false; reason?: string };
  try {
    driveRoute = await routeGeneratedDocToDrive({
      tenantId: ctx.tenantId,
      jobId: ctx.jobId,
      fileName: `Research - ${ctx.company} - ${ctx.position}`,
      content: docText,
      fallbackFolder: "research",
    });
  } catch (error) {
    driveRoute = { ok: false, reason: error instanceof Error ? error.message : "Drive route failed" };
  }

  if (driveRoute.ok) {
    await DocumentModel.findByIdAndUpdate(doc._id, {
      googleDriveFileId: driveRoute.googleDocId,
      driveFileId: driveRoute.googleDocId,
      driveFileLink: driveRoute.googleDocUrl,
      googleDriveFolderId: driveRoute.parentId,
      storageProvider: "Google Drive",
      storageLocation: driveRoute.storageLocation,
      storageUrl: driveRoute.googleDocUrl,
      $set: {
        "metadata.googleDocId": driveRoute.googleDocId,
        "metadata.googleDocUrl": driveRoute.googleDocUrl,
        "metadata.storageLocation": driveRoute.storageLocation,
      },
    });
  } else {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "research-document",
      status: "Warning",
      message: `Drive save skipped: ${driveRoute.reason ?? "Drive unavailable"}`,
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
    });
  }

  try {
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Completed",
      aiProcessingCompletedAt: new Date(),
      researchGenerated: true,
      lastAiRunAt: new Date(),
      researchDocumentId: toId(doc._id),
      researchDocumentLink: driveRoute.ok ? driveRoute.googleDocUrl : undefined,
    });
  } catch (e) {
    logger.warn({ err: e, jobId: ctx.jobId }, "job status update after research failed (document saved)");
  }

  const durationMs = Date.now() - started;

  await writeAutomationLog({
    tenantId: ctx.tenantId,
    moduleKey: "research-document",
    status: "Success",
    message: "Research document generated",
    operationId: ctx.operationId,
    relatedRecordType: "Document",
    relatedRecordId: toId(doc._id),
    durationMs,
    metadata: generationLogMeta(ctx.jobId, generated.model, { documentId: toId(doc._id) }),
  });

  await notifyAutomationEvent({
    tenantId: ctx.tenantId,
    moduleKey: "research-document",
    event: "research-generated",
    message: `Research ready for ${ctx.company} — ${ctx.position}${driveRoute.ok ? `\nOpen research: ${driveRoute.googleDocUrl}` : ""}`,
    operationId: ctx.operationId,
    metadata: { jobId: ctx.jobId, documentId: toId(doc._id) },
  });

  return {
    ...suppressFlag,
    moduleKey: "research-document",
    status: "completed",
    operationId: ctx.operationId,
    jobId: ctx.jobId,
    documentId: toId(doc._id),
    model: generated.model,
  };
}

interface CoverLetterJson {
  subject: string;
  cover_letter: string;
  key_customizations: string[];
  missing_info_warnings: string[];
}

function parseCoverLetterJson(text: string): CoverLetterJson | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned) as CoverLetterJson;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as CoverLetterJson; } catch { return null; }
    }
    return null;
  }
}

export async function createCoverLetterDocument(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  operationId?: string;
  logModuleKey?: string;
}) {
  const started = Date.now();
  const logModule = input.logModuleKey ?? "ai-processing";
  const ctx = await loadJobContext(input);
  const profile = await loadWorkspaceProfileForPrompt(ctx.tenantId, ctx.userId);

  if (!profile.cvText) {
    const message = "Master CV is missing. Upload a CV before generating tailored cover letters.";
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Warning",
      message,
      operationId: ctx.operationId,
      relatedRecordType: "Job",
      relatedRecordId: ctx.jobId,
      metadata: { source: "worker:cover-letter", missingProfileDocument: "cv_resume" },
    });
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Failed",
      aiProcessingError: message,
      aiProcessingCompletedAt: new Date(),
    });
    throw new Error(message);
  }

  const profileBlock = formatProfileContextBlock(profile);
  const title = sanitizeTitle(`Cover Letter — ${ctx.company} — ${ctx.position}`);

  if (!profile.coverLetterStyleText) {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Warning",
      message: "Cover letter template missing. Generated using default structure.",
      operationId: ctx.operationId,
      relatedRecordType: "Job",
      relatedRecordId: ctx.jobId,
      metadata: { source: "worker:cover-letter", missingProfileDocument: "cover_letter_template" },
    });
  }

  const prompt = [
    "You are a professional cover letter writer. Output ONLY valid JSON — no markdown, no commentary.",
    "Return a single JSON object with exactly these keys:",
    '  "subject": string — email subject line for this application (e.g. "Application for Senior Engineer at Acme Corp")',
    '  "cover_letter": string — full cover letter text, 250-350 words, plain text with line breaks (\\n), tailored to the role',
    '  "key_customizations": array of 3-5 strings — specific ways this letter is tailored to the role/company',
    '  "missing_info_warnings": array of strings — any info missing from the CV that the JD requires (empty array if none)',
    "",
    "STRICT RULES:",
    "- Use ONLY employers, titles, skills, tools, and metrics evidenced in the CV below.",
    "- Do not invent degrees, certifications, employers, or achievements not in the CV.",
    "- If the JD requires experience not in the CV, note it in missing_info_warnings; do not fabricate it in the letter.",
    "- When a reference cover letter is provided, mirror its tone and formality.",
    "",
    `Candidate name (for sign-off only): ${ctx.userName ?? "Unknown User"}`,
    `Company: ${ctx.company}`,
    `Position: ${ctx.position}`,
    `Location: ${ctx.location ?? "Not specified"}`,
    `Job description:\n${ctx.description ?? "Not provided"}`,
    "",
    profileBlock,
  ].join("\n");

  let generated: ClaudeResult;
  try {
    generated = await generateWithClaude({ prompt, maxTokens: 1500, temperature: 0.3 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Claude generation failed";
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Failed",
      message: `Cover letter generation failed: ${redactForLog(errorMessage, 300)}`,
      operationId: ctx.operationId,
      relatedRecordType: "Job",
      relatedRecordId: ctx.jobId,
      metadata: { source: "worker:cover-letter" },
    });
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Failed",
      aiProcessingError: "Cover letter generation failed. Check AI configuration.",
      aiProcessingCompletedAt: new Date(),
    });
    throw error;
  }

  const parsed = parseCoverLetterJson(generated.text);
  const coverLetterText = parsed?.cover_letter ?? generated.text;

  const doc = await persistDocument({
    tenantId: ctx.tenantId,
    createdBy: ctx.userId,
    jobId: ctx.jobId,
    fileName: title,
    type: "Cover Letter",
    status: "Ready",
    documentKind: "Cover Letter",
    generationStatus: "Generated",
    aiGenerated: true,
    aiProvider: "Claude",
    aiModel: generated.model,
    contentText: coverLetterText,
    metadata: {
      operationId: ctx.operationId,
      source: "worker:cover-letter",
      model: generated.model,
      generatedAt: new Date().toISOString(),
      usedWorkspaceProfile: Boolean(profile.cvText || profile.coverLetterStyleText),
      sourceCvDocumentId: profile.cvDocumentId,
      sourceCvFileName: profile.cvFileName,
      coverLetterTemplateDocumentId: profile.coverLetterTemplateDocumentId,
      coverLetterTemplateFileName: profile.coverLetterTemplateFileName,
      ...(parsed ? {
        subject: parsed.subject,
        keyCustomizations: parsed.key_customizations,
        missingInfoWarnings: parsed.missing_info_warnings,
      } : {}),
    },
  });

  let draftCopy:
    | { ok: true; googleDocId: string; googleDocUrl: string; parentId?: string; storageLocation?: string }
    | { ok: false; reason?: string } = { ok: false };
  let coverLetterCopy:
    | { ok: true; googleDocId: string; googleDocUrl: string; parentId?: string; storageLocation?: string }
    | { ok: false; reason?: string } = { ok: false };

  try {
    draftCopy = await routeGeneratedDocToDrive({
      tenantId: ctx.tenantId,
      jobId: ctx.jobId,
      fileName: `AI Draft - ${ctx.company} - ${ctx.position}`,
      content: coverLetterText,
      fallbackFolder: "ai-drafts",
    });
    coverLetterCopy = await routeGeneratedDocToDrive({
      tenantId: ctx.tenantId,
      jobId: ctx.jobId,
      fileName: `Cover Letter - ${ctx.company} - ${ctx.position}`,
      content: coverLetterText,
      fallbackFolder: "cover-letter",
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Drive route failed";
    draftCopy = { ok: false, reason };
    coverLetterCopy = { ok: false, reason };
  }

  if (draftCopy.ok || coverLetterCopy.ok) {
    await DocumentModel.findByIdAndUpdate(doc._id, {
      googleDriveFileId: draftCopy.ok ? draftCopy.googleDocId : coverLetterCopy.ok ? coverLetterCopy.googleDocId : undefined,
      driveFileId: draftCopy.ok ? draftCopy.googleDocId : coverLetterCopy.ok ? coverLetterCopy.googleDocId : undefined,
      driveFileLink: draftCopy.ok ? draftCopy.googleDocUrl : coverLetterCopy.ok ? coverLetterCopy.googleDocUrl : undefined,
      googleDriveFolderId: draftCopy.ok ? draftCopy.parentId : coverLetterCopy.ok ? coverLetterCopy.parentId : undefined,
      storageProvider: "Google Drive",
      storageLocation: draftCopy.ok ? draftCopy.storageLocation : coverLetterCopy.ok ? coverLetterCopy.storageLocation : undefined,
      storageUrl: draftCopy.ok ? draftCopy.googleDocUrl : coverLetterCopy.ok ? coverLetterCopy.googleDocUrl : undefined,
      $set: {
        "metadata.googleDocId": draftCopy.ok ? draftCopy.googleDocId : coverLetterCopy.ok ? coverLetterCopy.googleDocId : undefined,
        "metadata.googleDocUrl": draftCopy.ok ? draftCopy.googleDocUrl : coverLetterCopy.ok ? coverLetterCopy.googleDocUrl : undefined,
        "metadata.storageLocation": draftCopy.ok ? draftCopy.storageLocation : coverLetterCopy.ok ? coverLetterCopy.storageLocation : undefined,
        "metadata.aiDraftGoogleDocId": draftCopy.ok ? draftCopy.googleDocId : undefined,
        "metadata.aiDraftGoogleDocUrl": draftCopy.ok ? draftCopy.googleDocUrl : undefined,
        "metadata.coverLetterGoogleDocId": coverLetterCopy.ok ? coverLetterCopy.googleDocId : undefined,
        "metadata.coverLetterGoogleDocUrl": coverLetterCopy.ok ? coverLetterCopy.googleDocUrl : undefined,
      },
    });
    if (draftCopy.ok) {
      await JobModel.findByIdAndUpdate(ctx.jobId, {
        aiDraftDocId: draftCopy.googleDocId,
        aiDraftDocUrl: draftCopy.googleDocUrl,
        generatedCoverLetterDocumentId: toId(doc._id),
        generatedCoverLetterLink: coverLetterCopy.ok ? coverLetterCopy.googleDocUrl : draftCopy.googleDocUrl,
        sourceCvDocumentId: profile.cvDocumentId,
        sourceCvFileName: profile.cvFileName,
        coverLetterTemplateDocumentId: profile.coverLetterTemplateDocumentId,
        coverLetterTemplateFileName: profile.coverLetterTemplateFileName,
      });
    }
  } else {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Warning",
      message: "Drive save skipped for draft/cover-letter; MongoDB document retained.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
    });
  }

  try {
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Completed",
      aiProcessingCompletedAt: new Date(),
      draftGenerated: true,
      lastAiRunAt: new Date(),
      sourceCvDocumentId: profile.cvDocumentId,
      sourceCvFileName: profile.cvFileName,
      coverLetterTemplateDocumentId: profile.coverLetterTemplateDocumentId,
      coverLetterTemplateFileName: profile.coverLetterTemplateFileName,
      generatedCoverLetterDocumentId: toId(doc._id),
      generatedCoverLetterLink: coverLetterCopy.ok ? coverLetterCopy.googleDocUrl : draftCopy.ok ? draftCopy.googleDocUrl : undefined,
    });
  } catch (e) {
    logger.warn({ err: e, jobId: ctx.jobId }, "job status update after cover letter failed (document saved)");
  }

  const durationMs = Date.now() - started;

  await writeAutomationLog({
    tenantId: ctx.tenantId,
    moduleKey: logModule,
    status: "Success",
    message: "Cover letter generated",
    operationId: ctx.operationId,
    relatedRecordType: "Document",
    relatedRecordId: toId(doc._id),
    durationMs,
    metadata: generationLogMeta(ctx.jobId, generated.model, { documentId: toId(doc._id) }),
  });

  await notifyAutomationEvent({
    tenantId: ctx.tenantId,
    moduleKey: logModule,
    event: "cover-letter-generated",
    message: `AI draft generated for ${ctx.company} — ${ctx.position}${draftCopy.ok ? `\nOpen draft: ${draftCopy.googleDocUrl}` : ""}`,
    operationId: ctx.operationId,
    metadata: { jobId: ctx.jobId, documentId: toId(doc._id) },
  });

  return {
    ...suppressFlag,
    moduleKey: logModule,
    status: "completed",
    operationId: ctx.operationId,
    jobId: ctx.jobId,
    documentId: toId(doc._id),
    model: generated.model,
  };
}

export async function createAiAnalysisDocument(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  operationId?: string;
}) {
  const started = Date.now();
  const ctx = await loadJobContext(input);
  const profile = await loadWorkspaceProfileForPrompt(ctx.tenantId, ctx.userId);
  const profileBlock = formatProfileContextBlock(profile);
  const title = sanitizeTitle(`AI Analysis — ${ctx.company} — ${ctx.position}`);

  const prompt = [
    "Produce a structured job-fit analysis in plain text with headings:",
    "Fit summary",
    "Missing information",
    "Recommended next actions",
    "Suggested follow-up",
    "",
    `Company: ${ctx.company}`,
    `Position: ${ctx.position}`,
    `Location: ${ctx.location ?? "Not specified"}`,
    `Description: ${ctx.description ?? "Not provided"}`,
    ...(profileBlock
      ? [
          "",
          profileBlock,
          "",
          "Ground the Fit summary in the CV when it is provided. Note gaps honestly if job requirements are not evidenced in the CV.",
        ]
      : []),
  ].join("\n");

  let generated: ClaudeResult;
  try {
    generated = await generateWithClaude({ prompt, maxTokens: 1200, temperature: 0.2 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Claude generation failed";
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "ai-processing",
      status: "Failed",
      message: `AI analysis generation failed: ${redactForLog(errorMessage, 300)}`,
      operationId: ctx.operationId,
      relatedRecordType: "Job",
      relatedRecordId: ctx.jobId,
      metadata: { source: "worker:ai-processing" },
    });
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Failed",
      aiProcessingError: "AI analysis generation failed. Check AI configuration.",
      aiProcessingCompletedAt: new Date(),
    });
    throw error;
  }

  const doc = await persistDocument({
    tenantId: ctx.tenantId,
    createdBy: ctx.userId,
    jobId: ctx.jobId,
    fileName: title,
    type: "Other",
    status: "Ready",
    documentKind: "Other",
    generationStatus: "Generated",
    aiGenerated: true,
    aiProvider: "Claude",
    aiModel: generated.model,
    contentText: generated.text,
    metadata: {
      operationId: ctx.operationId,
      source: "worker:ai-processing",
      documentCategory: "ai-analysis",
      model: generated.model,
      generatedAt: new Date().toISOString(),
      usedWorkspaceProfile: Boolean(profile.cvText || profile.coverLetterStyleText || profile.portfolioText),
    },
  });

  try {
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Completed",
      aiProcessingCompletedAt: new Date(),
      lastAiRunAt: new Date(),
    });
  } catch (e) {
    logger.warn({ err: e, jobId: ctx.jobId }, "job status update after AI analysis failed (document saved)");
  }

  const durationMs = Date.now() - started;

  await writeAutomationLog({
    tenantId: ctx.tenantId,
    moduleKey: "ai-processing",
    status: "Success",
    message: "AI job analysis generated",
    operationId: ctx.operationId,
    relatedRecordType: "Document",
    relatedRecordId: toId(doc._id),
    durationMs,
    metadata: generationLogMeta(ctx.jobId, generated.model, { documentId: toId(doc._id), kind: "ai-analysis" }),
  });

  return {
    ...suppressFlag,
    moduleKey: "ai-processing",
    status: "completed",
    operationId: ctx.operationId,
    jobId: ctx.jobId,
    documentId: toId(doc._id),
    kind: "ai-analysis",
    model: generated.model,
  };
}
