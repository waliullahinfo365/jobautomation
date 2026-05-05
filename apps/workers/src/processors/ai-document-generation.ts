import { AutomationLogModel, DocumentModel, JobModel, TenantModel, UserModel } from "@jobflow/database/models";
import { formatProfileContextBlock, loadWorkspaceProfileForPrompt } from "../lib/workspace-profile-docs";
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

type FallbackReason = "none" | "no-api-key" | "claude-error";

type ClaudeResult = {
  text: string;
  model: string;
  usedFallback: boolean;
  fallbackReason: FallbackReason;
  /** Sanitized short reason when fallbackReason === claude-error */
  claudeFailureSummary?: string;
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

function extractClaudeText(responseJson: unknown): string | null {
  const content = (responseJson as { content?: Array<{ type?: string; text?: string }> })?.content;
  if (!Array.isArray(content)) return null;
  const textParts = content
    .filter((c) => c?.type === "text" && typeof c?.text === "string")
    .map((c) => c.text?.trim())
    .filter(Boolean) as string[];
  return textParts.length > 0 ? textParts.join("\n\n") : null;
}

async function generateWithClaude(input: {
  prompt: string;
  fallbackText: string;
  modelHint?: string;
}): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim() || input.modelHint || "claude-3-5-sonnet-latest";

  if (!apiKey) {
    return { text: input.fallbackText, model: "stub", usedFallback: true, fallbackReason: "no-api-key" };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        temperature: 0.2,
        messages: [{ role: "user", content: input.prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown anthropic error");
      const summary = redactForLog(`HTTP ${response.status}: ${errorText.slice(0, 400)}`);
      return {
        text: input.fallbackText,
        model: "stub",
        usedFallback: true,
        fallbackReason: "claude-error",
        claudeFailureSummary: summary,
      };
    }

    const json = (await response.json()) as unknown;
    const text = extractClaudeText(json);
    if (!text) {
      return {
        text: input.fallbackText,
        model: "stub",
        usedFallback: true,
        fallbackReason: "claude-error",
        claudeFailureSummary: "Claude response had no text content",
      };
    }
    return { text, model, usedFallback: false, fallbackReason: "none" };
  } catch (error) {
    const ser = serializeWorkerError(error);
    return {
      text: input.fallbackText,
      model: "stub",
      usedFallback: true,
      fallbackReason: "claude-error",
      claudeFailureSummary: redactForLog(ser.message),
    };
  }
}

function generationLogMeta(
  jobId: string,
  generated: ClaudeResult,
  extra: Record<string, unknown>
): Record<string, unknown> {
  const base: Record<string, unknown> = { jobId, model: generated.model, usedFallback: generated.usedFallback, ...extra };
  if (generated.fallbackReason === "claude-error" && generated.claudeFailureSummary) {
    base.claudeErrorSummary = generated.claudeFailureSummary;
  }
  return base;
}

async function persistDocument(docPayload: Record<string, unknown>) {
  try {
    return await DocumentModel.create(docPayload);
  } catch (error) {
    const ser = serializeWorkerError(error);
    throw new Error(`Failed to save document: ${redactForLog(ser.message)}`);
  }
}

const suppressFlag = { suppressWorkerCompletionLog: true as const };

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
    "Create a concise job research brief in plain text with these section headings:",
    "Company Overview",
    "Role Summary",
    "Key Requirements",
    "Resume Keywords",
    "Cover Letter Angles",
    "Interview Prep Notes",
    "",
    `Workspace: ${ctx.tenantName ?? "Unknown Workspace"}`,
    `Candidate: ${ctx.userName ?? "Unknown User"}`,
    `Company: ${ctx.company}`,
    `Position: ${ctx.position}`,
    `Location: ${ctx.location ?? "Not specified"}`,
    `Job description: ${ctx.description ?? "Not provided"}`,
    ...(profileBlock
      ? [
          "",
          profileBlock,
          "",
          "When profile documents are provided, align Resume Keywords and Cover Letter Angles with real skills and experience from the CV. If no CV is provided, use general best practices only.",
        ]
      : []),
  ].join("\n");

  const fallbackText = [
    "Company Overview",
    `${ctx.company} is hiring for ${ctx.position}.`,
    "",
    "Role Summary",
    "Focus on delivery, collaboration, and measurable outcomes aligned with the role.",
    "",
    "Key Requirements",
    "- Relevant experience for the role",
    "- Strong communication and ownership",
    "- Track record of shipped work",
    "",
    "Resume Keywords",
    "- Cross-functional delivery",
    "- System design",
    "- Metrics-driven execution",
    "",
    "Cover Letter Angles",
    "- Business impact from prior projects",
    "- Alignment with company mission",
    "",
    "Interview Prep Notes",
    "- Prepare 2–3 STAR stories with metrics",
    "- Research recent company news",
  ].join("\n");

  const generated = await generateWithClaude({
    prompt,
    fallbackText,
    modelHint: "claude-3-5-sonnet-latest",
  });

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
    aiProvider: generated.usedFallback ? "Stub" : "Claude",
    aiModel: generated.model,
    contentText: generated.text,
    metadata: {
      operationId: ctx.operationId,
      source: "worker:research-document",
      model: generated.model,
      generatedAt: new Date().toISOString(),
      usedWorkspaceProfile: Boolean(profile.cvText || profile.coverLetterStyleText || profile.portfolioText),
      fallbackReason: generated.fallbackReason,
      ...(generated.claudeFailureSummary ? { claudeErrorSummary: generated.claudeFailureSummary } : {}),
    },
  });

  try {
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Completed",
      aiProcessingCompletedAt: new Date(),
      researchGenerated: true,
      lastAiRunAt: new Date(),
    });
  } catch (e) {
    logger.warn({ err: e, jobId: ctx.jobId }, "job status update after research failed (document saved)");
  }

  const durationMs = Date.now() - started;

  if (!generated.usedFallback) {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "research-document",
      status: "Success",
      message: "Research document generated",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id) }),
    });
  } else if (generated.fallbackReason === "no-api-key") {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "research-document",
      status: "Warning",
      message: "Claude API key missing; generated demo AI draft.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id) }),
    });
  } else {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "research-document",
      status: "Warning",
      message: "Claude generation failed; fallback draft created.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id) }),
    });
  }

  return {
    ...suppressFlag,
    moduleKey: "research-document",
    status: "completed",
    operationId: ctx.operationId,
    jobId: ctx.jobId,
    documentId: toId(doc._id),
    model: generated.model,
    usedFallback: generated.usedFallback,
  };
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
  const profileBlock = formatProfileContextBlock(profile);
  const title = sanitizeTitle(`Cover Letter — ${ctx.company} — ${ctx.position}`);

  const prompt = [
    "Write a professional cover letter in plain text.",
    "Keep it concise (around 250–350 words), tailored to the role and company below.",
    "",
    "STRICT RULES:",
    "- Use ONLY employers, titles, skills, tools, and metrics that appear in the CV excerpt below (when provided).",
    "- Do not invent degrees, certifications, employers, or achievements that are not supported by the CV.",
    "- If the job description requires experience not evidenced in the CV, use careful wording: emphasize transferable skills, learning agility, and motivation without claiming direct experience you cannot cite from the CV.",
    "- When a reference cover letter is provided, mirror its tone, pacing, salutation style, and formality. Do not copy employer-specific paragraphs verbatim.",
    "",
    `Workspace: ${ctx.tenantName ?? "Unknown Workspace"}`,
    `Candidate name (for sign-off only; do not fabricate credentials): ${ctx.userName ?? "Unknown User"}`,
    `Company: ${ctx.company}`,
    `Position: ${ctx.position}`,
    `Location: ${ctx.location ?? "Not specified"}`,
    `Job description: ${ctx.description ?? "Not provided"}`,
    ...(profileBlock ? ["", profileBlock] : ["", "(No workspace CV uploaded — write a generic letter without specific employment claims.)"]),
  ].join("\n");

  const fallbackText = profile.cvText
    ? [
        `Dear Hiring Team at ${ctx.company},`,
        "",
        `I am writing to express my interest in the ${ctx.position} role. Drawing on the experience summarized in my CV, I focus on delivering reliable outcomes, collaborating across teams, and taking ownership end to end.`,
        "",
        "I would welcome the opportunity to discuss how my background aligns with your needs. Thank you for your consideration.",
      ].join("\n")
    : [
        `Dear Hiring Team at ${ctx.company},`,
        "",
        `I am writing to express my interest in the ${ctx.position} role. I am eager to contribute through strong collaboration, clear communication, and ownership of outcomes.`,
        "",
        "I would welcome the opportunity to discuss this role further. Thank you for your consideration.",
      ].join("\n");

  const generated = await generateWithClaude({
    prompt,
    fallbackText,
    modelHint: "claude-3-5-sonnet-latest",
  });

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
    aiProvider: generated.usedFallback ? "Stub" : "Claude",
    aiModel: generated.model,
    contentText: generated.text,
    metadata: {
      operationId: ctx.operationId,
      source: "worker:cover-letter",
      model: generated.model,
      generatedAt: new Date().toISOString(),
      usedWorkspaceProfile: Boolean(profile.cvText || profile.coverLetterStyleText),
      fallbackReason: generated.fallbackReason,
      ...(generated.claudeFailureSummary ? { claudeErrorSummary: generated.claudeFailureSummary } : {}),
    },
  });

  try {
    await JobModel.findByIdAndUpdate(ctx.jobId, {
      aiProcessingStatus: "Completed",
      aiProcessingCompletedAt: new Date(),
      draftGenerated: true,
      lastAiRunAt: new Date(),
    });
  } catch (e) {
    logger.warn({ err: e, jobId: ctx.jobId }, "job status update after cover letter failed (document saved)");
  }

  const durationMs = Date.now() - started;

  if (!generated.usedFallback) {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Success",
      message: "Cover letter generated",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id) }),
    });
  } else if (generated.fallbackReason === "no-api-key") {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Warning",
      message: "Claude API key missing; generated demo AI draft.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id) }),
    });
  } else {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Warning",
      message: "Claude generation failed; fallback draft created.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id) }),
    });
  }

  return {
    ...suppressFlag,
    moduleKey: logModule,
    status: "completed",
    operationId: ctx.operationId,
    jobId: ctx.jobId,
    documentId: toId(doc._id),
    model: generated.model,
    usedFallback: generated.usedFallback,
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

  const fallbackText = [
    "Fit summary",
    `The ${ctx.position} role at ${ctx.company} appears aligned with a candidate who can deliver outcomes and collaborate broadly. Strength areas: execution, communication, ownership.`,
    "",
    "Missing information",
    "- Compensation band",
    "- Team size and stack details",
    "- Interview process timeline",
    "",
    "Recommended next actions",
    "- Complete research brief and tailor resume bullets",
    "- Draft cover letter emphasizing measurable impact",
    "- Schedule informational chat if possible",
    "",
    "Suggested follow-up",
    "- Track application status weekly",
    "- Prepare questions for hiring manager",
  ].join("\n");

  const generated = await generateWithClaude({
    prompt,
    fallbackText,
    modelHint: "claude-3-5-sonnet-latest",
  });

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
    aiProvider: generated.usedFallback ? "Stub" : "Claude",
    aiModel: generated.model,
    contentText: generated.text,
    metadata: {
      operationId: ctx.operationId,
      source: "worker:ai-processing",
      documentCategory: "ai-analysis",
      model: generated.model,
      generatedAt: new Date().toISOString(),
      usedWorkspaceProfile: Boolean(profile.cvText || profile.coverLetterStyleText || profile.portfolioText),
      fallbackReason: generated.fallbackReason,
      ...(generated.claudeFailureSummary ? { claudeErrorSummary: generated.claudeFailureSummary } : {}),
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

  if (!generated.usedFallback) {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "ai-processing",
      status: "Success",
      message: "AI job analysis generated",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id), kind: "ai-analysis" }),
    });
  } else if (generated.fallbackReason === "no-api-key") {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "ai-processing",
      status: "Warning",
      message: "Claude API key missing; generated demo AI draft.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id), kind: "ai-analysis" }),
    });
  } else {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "ai-processing",
      status: "Warning",
      message: "Claude generation failed; fallback draft created.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: generationLogMeta(ctx.jobId, generated, { documentId: toId(doc._id), kind: "ai-analysis" }),
    });
  }

  return {
    ...suppressFlag,
    moduleKey: "ai-processing",
    status: "completed",
    operationId: ctx.operationId,
    jobId: ctx.jobId,
    documentId: toId(doc._id),
    kind: "ai-analysis",
    model: generated.model,
    usedFallback: generated.usedFallback,
  };
}
