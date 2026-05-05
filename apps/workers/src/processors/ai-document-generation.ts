import { AutomationLogModel, DocumentModel, JobModel, TenantModel, UserModel } from "@jobflow/database/models";

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
  usedFallback: boolean;
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
  const job = await JobModel.findOne({ tenantId: input.tenantId, _id: input.jobId }).lean();
  if (!job) {
    throw new Error(`Job not found for tenant/job: ${input.tenantId}/${input.jobId}`);
  }

  const [tenant, user] = await Promise.all([
    TenantModel.findById(input.tenantId).lean(),
    UserModel.findOne({ tenantId: input.tenantId, _id: input.userId }).lean(),
  ]);

  return {
    tenantId: input.tenantId,
    userId: input.userId,
    operationId: input.operationId ?? `op-${Date.now()}`,
    jobId: input.jobId,
    company: String((job as Record<string, unknown>).company ?? "Unknown Company"),
    position: String((job as Record<string, unknown>).position ?? "Unknown Position"),
    description: ((job as Record<string, unknown>).description as string | undefined) ?? undefined,
    location: ((job as Record<string, unknown>).location as string | undefined) ?? undefined,
    tenantName: (tenant as Record<string, unknown> | null)?.name as string | undefined,
    userName: (user as Record<string, unknown> | null)?.name as string | undefined,
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
    return { text: input.fallbackText, model: "stub", usedFallback: true };
  }

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
    throw new Error(`Claude request failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const json = (await response.json()) as unknown;
  const text = extractClaudeText(json);
  if (!text) {
    throw new Error("Claude response did not include text content");
  }
  return { text, model, usedFallback: false };
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

  const doc = await DocumentModel.create({
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
    },
  });

  await JobModel.findByIdAndUpdate(ctx.jobId, {
    aiProcessingStatus: "Completed",
    aiProcessingCompletedAt: new Date(),
    researchGenerated: true,
    lastAiRunAt: new Date(),
  });

  const durationMs = Date.now() - started;

  if (generated.usedFallback) {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "research-document",
      status: "Warning",
      message: "Claude API key missing; generated demo placeholder document.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: { jobId: ctx.jobId, usedFallback: true, model: generated.model },
    });
  } else {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "research-document",
      status: "Success",
      message: "Research document generated",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: { jobId: ctx.jobId, documentId: toId(doc._id), model: generated.model },
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
  const title = sanitizeTitle(`Cover Letter — ${ctx.company} — ${ctx.position}`);

  const prompt = [
    "Write a professional cover letter in plain text.",
    "Keep it concise (around 250–350 words), tailored to the role.",
    "",
    `Workspace: ${ctx.tenantName ?? "Unknown Workspace"}`,
    `Candidate: ${ctx.userName ?? "Unknown User"}`,
    `Company: ${ctx.company}`,
    `Position: ${ctx.position}`,
    `Location: ${ctx.location ?? "Not specified"}`,
    `Job description: ${ctx.description ?? "Not provided"}`,
  ].join("\n");

  const fallbackText = [
    `Dear Hiring Team at ${ctx.company},`,
    "",
    `I am writing to express my interest in the ${ctx.position} role. My experience includes shipping impactful work, collaborating across teams, and owning outcomes end to end.`,
    "",
    "I would welcome the opportunity to contribute to your team. Thank you for your consideration.",
  ].join("\n");

  const generated = await generateWithClaude({
    prompt,
    fallbackText,
    modelHint: "claude-3-5-sonnet-latest",
  });

  const doc = await DocumentModel.create({
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
    },
  });

  await JobModel.findByIdAndUpdate(ctx.jobId, {
    aiProcessingStatus: "Completed",
    aiProcessingCompletedAt: new Date(),
    draftGenerated: true,
    lastAiRunAt: new Date(),
  });

  const durationMs = Date.now() - started;

  if (generated.usedFallback) {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Warning",
      message: "Claude API key missing; generated demo placeholder document.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: { jobId: ctx.jobId, usedFallback: true, model: generated.model },
    });
  } else {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: logModule,
      status: "Success",
      message: "Cover letter generated",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: { jobId: ctx.jobId, documentId: toId(doc._id), model: generated.model },
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

  const doc = await DocumentModel.create({
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
    },
  });

  await JobModel.findByIdAndUpdate(ctx.jobId, {
    aiProcessingStatus: "Completed",
    aiProcessingCompletedAt: new Date(),
    lastAiRunAt: new Date(),
  });

  const durationMs = Date.now() - started;

  if (generated.usedFallback) {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "ai-processing",
      status: "Warning",
      message: "Claude API key missing; saved demo AI analysis document.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: { jobId: ctx.jobId, usedFallback: true, kind: "ai-analysis" },
    });
  } else {
    await writeAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "ai-processing",
      status: "Success",
      message: "AI job analysis generated",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      durationMs,
      metadata: { jobId: ctx.jobId, documentId: toId(doc._id), kind: "ai-analysis", model: generated.model },
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
