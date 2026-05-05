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

function sanitizeFileName(value: string): string {
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

async function createAutomationLog(input: {
  tenantId: string;
  moduleKey: string;
  status: "Success" | "Warning" | "Failed" | "Running";
  message: string;
  operationId: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
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

export async function createResearchDocument(input: {
  tenantId: string;
  userId: string;
  jobId: string;
  operationId?: string;
}) {
  const ctx = await loadJobContext(input);
  const title = sanitizeFileName(`Research — ${ctx.company} ${ctx.position}`);

  const prompt = [
    "Create a concise job research brief in plain text with these sections:",
    "1) Company overview",
    "2) Role summary",
    "3) Key requirements",
    "4) Suggested resume keywords",
    "5) Suggested cover letter angles",
    "6) Interview preparation notes",
    "",
    `Tenant/workspace: ${ctx.tenantName ?? "Unknown Workspace"}`,
    `Candidate/User: ${ctx.userName ?? "Unknown User"}`,
    `Company: ${ctx.company}`,
    `Position: ${ctx.position}`,
    `Location: ${ctx.location ?? "Not specified"}`,
    `Job description: ${ctx.description ?? "Not provided"}`,
  ].join("\n");

  const fallbackText = [
    `Company overview: ${ctx.company} is actively hiring for ${ctx.position}.`,
    `Role summary: The role focuses on delivery, collaboration, and measurable impact.`,
    "Key requirements:",
    "- Relevant role experience",
    "- Strong communication and ownership",
    "- Evidence of shipped outcomes",
    "Suggested resume keywords:",
    "- Frontend architecture",
    "- Cross-functional delivery",
    "- Performance optimization",
    "Suggested cover letter angles:",
    "- Business impact from prior projects",
    "- Alignment with company mission",
    "- Collaboration and leadership examples",
    "Interview preparation notes:",
    "- Prepare 2-3 STAR examples with metrics.",
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
      completedStatus: true,
    },
  });

  await JobModel.findByIdAndUpdate(ctx.jobId, {
    aiProcessingStatus: "Completed",
    aiProcessingCompletedAt: new Date(),
    researchGenerated: true,
    lastAiRunAt: new Date(),
  });

  if (generated.usedFallback) {
    await createAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "research-document",
      status: "Warning",
      message: "Claude API key missing; generated demo placeholder document.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      metadata: { jobId: ctx.jobId, usedFallback: true },
    });
  }

  await createAutomationLog({
    tenantId: ctx.tenantId,
    moduleKey: "research-document",
    status: "Success",
    message: "Research document generated successfully.",
    operationId: ctx.operationId,
    relatedRecordType: "Document",
    relatedRecordId: toId(doc._id),
    metadata: { jobId: ctx.jobId, model: generated.model, usedFallback: generated.usedFallback },
  });

  return {
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
}) {
  const ctx = await loadJobContext(input);
  const title = sanitizeFileName(`Cover Letter — ${ctx.company} ${ctx.position}`);

  const prompt = [
    "Write a professional cover letter in plain text.",
    "Keep it concise (around 250-350 words), specific, and tailored to the role.",
    "Include greeting, role-fit body, measurable outcomes, and a clear close.",
    "",
    `Tenant/workspace: ${ctx.tenantName ?? "Unknown Workspace"}`,
    `Candidate/User: ${ctx.userName ?? "Unknown User"}`,
    `Company: ${ctx.company}`,
    `Position: ${ctx.position}`,
    `Location: ${ctx.location ?? "Not specified"}`,
    `Job description: ${ctx.description ?? "Not provided"}`,
  ].join("\n");

  const fallbackText = [
    `Dear Hiring Team at ${ctx.company},`,
    "",
    `I am excited to apply for the ${ctx.position} role. My background includes delivering projects with measurable business impact, collaborating across functions, and taking ownership from planning through execution.`,
    "",
    "In my recent work, I improved delivery speed and quality by simplifying workflows, partnering closely with product and design, and prioritizing outcomes that matter to customers and stakeholders.",
    "",
    `I would value the opportunity to bring this same focus to ${ctx.company}. Thank you for your time and consideration.`,
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
      completedStatus: true,
    },
  });

  await JobModel.findByIdAndUpdate(ctx.jobId, {
    aiProcessingStatus: "Completed",
    aiProcessingCompletedAt: new Date(),
    draftGenerated: true,
    lastAiRunAt: new Date(),
  });

  if (generated.usedFallback) {
    await createAutomationLog({
      tenantId: ctx.tenantId,
      moduleKey: "cover-letter",
      status: "Warning",
      message: "Claude API key missing; generated demo placeholder document.",
      operationId: ctx.operationId,
      relatedRecordType: "Document",
      relatedRecordId: toId(doc._id),
      metadata: { jobId: ctx.jobId, usedFallback: true },
    });
  }

  await createAutomationLog({
    tenantId: ctx.tenantId,
    moduleKey: "cover-letter",
    status: "Success",
    message: "Cover letter generated successfully.",
    operationId: ctx.operationId,
    relatedRecordType: "Document",
    relatedRecordId: toId(doc._id),
    metadata: { jobId: ctx.jobId, model: generated.model, usedFallback: generated.usedFallback },
  });

  return {
    moduleKey: "cover-letter",
    status: "completed",
    operationId: ctx.operationId,
    jobId: ctx.jobId,
    documentId: toId(doc._id),
    model: generated.model,
    usedFallback: generated.usedFallback,
  };
}
