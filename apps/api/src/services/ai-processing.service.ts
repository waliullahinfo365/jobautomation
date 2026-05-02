import { randomUUID } from "node:crypto";
import { DocumentModel, JobModel } from "@jobflow/database/models";
import {
  estimateAiUsage,
  runCoverLetterGeneration as integrationRunCoverLetter,
  runResearchGeneration as integrationRunResearch,
} from "@jobflow/integrations/ai/ai.service";
import type { AiProcessingResult, DraftGenerationResult, ResearchGenerationResult } from "@jobflow/shared/types/job";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { ApiError } from "../utils/errors";
import { assertCanUseAiCredits } from "./plan-limit.service";
import { logAiUsage } from "./ai-usage.service";
import { resolveAiProviderForTenant } from "./ai-provider-config.service";

type RunInput = {
  tenantId: string;
  jobId: string;
  userId: string;
  operationId?: string;
};

function safeFileName(company: string, position: string, suffix: string): string {
  const sanitize = (value: string) => value.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `${sanitize(company)}_${sanitize(position)}_${suffix}`;
}

export async function runResearchGeneration(input: RunInput): Promise<AiProcessingResult & { research: ResearchGenerationResult }> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const idempotencyKey = `ai-processing:${tenantId}:${input.jobId}:research-generation`;
  const job = await findTenantScopedById(JobModel, tenantId, input.jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const existingDocument = await DocumentModel.findOne({
    tenantId,
    jobId: input.jobId,
    documentKind: "Research",
    generationStatus: "Generated",
  });

  if (job.researchGenerated && existingDocument) {
    return {
      operationId,
      tenantId,
      jobId: input.jobId,
      runType: "research-generation",
      status: "Completed",
      documentsCreated: [String(existingDocument._id)],
      summary: "Research document already exists",
      usage: { estimatedCredits: 0 },
      research: {
        documentId: String(existingDocument._id),
        company: job.company,
        position: job.position,
        summary: existingDocument.contentText ?? "",
        keyRequirements: (existingDocument.generationMetadata as { keyRequirements?: string[] } | undefined)?.keyRequirements ?? [],
        companyResearch: (existingDocument.generationMetadata as { companyResearch?: string } | undefined)?.companyResearch ?? "",
        recommendedTalkingPoints:
          (existingDocument.generationMetadata as { talkingPoints?: string[] } | undefined)?.talkingPoints ?? [],
      },
    };
  }

  await createAutomationLog({
    tenantId,
    moduleKey: "research-document",
    moduleName: "Research Document",
    status: "Running",
    message: "Research generation started",
    relatedRecordType: "Job",
    relatedRecordId: input.jobId,
    operationId,
    idempotencyKey,
  });

  try {
    await JobModel.findByIdAndUpdate(job._id, {
      aiProcessingStatus: "Processing",
      aiProcessingStartedAt: new Date(),
      aiProcessingError: undefined,
    });

    const usage = estimateAiUsage({ runType: "research-generation", textLength: job.description?.length });
    await assertCanUseAiCredits(tenantId, usage.estimatedCredits);

    const aiCfg = await resolveAiProviderForTenant({ tenantId });
    const wrapped = await integrationRunResearch({
      job: {
        company: job.company,
        position: job.position,
        description: job.description,
        location: job.location,
      },
      config: aiCfg,
    });
    const research = wrapped.data;

    const doc = await DocumentModel.create({
      tenantId,
      createdBy: input.userId,
      jobId: input.jobId,
      fileName: safeFileName(job.company, job.position, "Research"),
      type: "Research",
      status: "Ready",
      documentKind: "Research",
      generationStatus: "Generated",
      aiGenerated: true,
      aiProvider: wrapped.provider,
      aiModel: wrapped.model,
      promptVersion: research.promptVersion,
      contentText: research.summary,
      generationMetadata: {
        keyRequirements: research.keyRequirements,
        companyResearch: research.companyResearch,
        talkingPoints: research.talkingPoints,
        confidence: research.confidence,
        usedStub: wrapped.usedStub,
      },
      metadata: {
        operationId,
      },
    });

    await JobModel.findByIdAndUpdate(job._id, {
      aiProcessingStatus: "Completed",
      aiProcessingCompletedAt: new Date(),
      researchGenerated: true,
      lastAiRunAt: new Date(),
    });
    await logAiUsage({
      tenantId,
      userId: input.userId,
      provider: wrapped.provider,
      model: wrapped.model,
      runType: "research-generation",
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: input.jobId,
      inputText: [job.company, job.position, job.description].filter(Boolean).join("\n"),
      outputText: [research.summary, research.companyResearch].join("\n"),
      usedStub: wrapped.usedStub,
    });

    await createAutomationLog({
      tenantId,
      moduleKey: "research-document",
      moduleName: "Research Document",
      status: "Success",
      message: "Research generation completed",
      relatedRecordType: "Job",
      relatedRecordId: input.jobId,
      operationId,
      idempotencyKey,
      metadata: { documentId: String(doc._id) },
    });

    return {
      operationId,
      tenantId,
      jobId: input.jobId,
      runType: "research-generation",
      status: "Completed",
      documentsCreated: [String(doc._id)],
      summary: "Research document generated",
      usage,
      research: {
        documentId: String(doc._id),
        company: job.company,
        position: job.position,
        summary: research.summary,
        keyRequirements: research.keyRequirements,
        companyResearch: research.companyResearch,
        recommendedTalkingPoints: research.talkingPoints,
      },
    };
  } catch (error) {
    await JobModel.findByIdAndUpdate(job._id, {
      aiProcessingStatus: "Failed",
      aiProcessingError: error instanceof Error ? error.message : "Unknown error",
    });
    await createAutomationLog({
      tenantId,
      moduleKey: "research-document",
      moduleName: "Research Document",
      status: "Failed",
      message: "Research generation failed",
      relatedRecordType: "Job",
      relatedRecordId: input.jobId,
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function runDraftGeneration(input: RunInput): Promise<AiProcessingResult & { draft: DraftGenerationResult }> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const idempotencyKey = `ai-processing:${tenantId}:${input.jobId}:draft-generation`;
  const job = await findTenantScopedById(JobModel, tenantId, input.jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const existingDocument = await DocumentModel.findOne({
    tenantId,
    jobId: input.jobId,
    documentKind: "Cover Letter",
    generationStatus: { $in: ["Generated", "Needs Review"] },
  });

  if (job.draftGenerated && existingDocument) {
    return {
      operationId,
      tenantId,
      jobId: input.jobId,
      runType: "draft-generation",
      status: "Completed",
      documentsCreated: [String(existingDocument._id)],
      summary: "Draft document already exists",
      usage: { estimatedCredits: 0 },
      draft: {
        documentId: String(existingDocument._id),
        company: job.company,
        position: job.position,
        draftText: existingDocument.contentText ?? "",
        tone: (existingDocument.generationMetadata as { tone?: string } | undefined)?.tone ?? "professional",
        sections: ["opening", "experienceMatch", "closing"],
      },
    };
  }

  await createAutomationLog({
    tenantId,
    moduleKey: "ai-processing",
    moduleName: "AI Processing",
    status: "Running",
    message: "Draft generation started",
    relatedRecordType: "Job",
    relatedRecordId: input.jobId,
    operationId,
    idempotencyKey,
  });

  try {
    await JobModel.findByIdAndUpdate(job._id, {
      aiProcessingStatus: "Processing",
      aiProcessingStartedAt: new Date(),
      aiProcessingError: undefined,
    });

    const usage = estimateAiUsage({ runType: "draft-generation", textLength: job.description?.length });
    await assertCanUseAiCredits(tenantId, usage.estimatedCredits);

    const aiCfg = await resolveAiProviderForTenant({ tenantId });
    const wrappedDraft = await integrationRunCoverLetter({
      job: {
        company: job.company,
        position: job.position,
        description: job.description,
      },
      config: aiCfg,
    });
    const draft = wrappedDraft.data;

    const doc = await DocumentModel.create({
      tenantId,
      createdBy: input.userId,
      jobId: input.jobId,
      fileName: safeFileName(job.company, job.position, "Cover_Letter_Draft"),
      type: "Cover Letter",
      status: "Draft",
      documentKind: "Cover Letter",
      generationStatus: "Needs Review",
      aiGenerated: true,
      aiProvider: wrappedDraft.provider,
      aiModel: wrappedDraft.model,
      promptVersion: draft.promptVersion,
      contentText: draft.draftText,
      generationMetadata: {
        opening: draft.opening,
        experienceMatch: draft.experienceMatch,
        closing: draft.closing,
        tone: draft.tone,
        confidence: draft.confidence,
        usedStub: wrappedDraft.usedStub,
      },
      metadata: {
        operationId,
      },
    });

    await JobModel.findByIdAndUpdate(job._id, {
      aiProcessingStatus: "Completed",
      aiProcessingCompletedAt: new Date(),
      draftGenerated: true,
      lastAiRunAt: new Date(),
    });
    await logAiUsage({
      tenantId,
      userId: input.userId,
      provider: wrappedDraft.provider,
      model: wrappedDraft.model,
      runType: "draft-generation",
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: input.jobId,
      inputText: [job.company, job.position, job.description].filter(Boolean).join("\n"),
      outputText: draft.draftText,
      usedStub: wrappedDraft.usedStub,
    });

    await createAutomationLog({
      tenantId,
      moduleKey: "ai-processing",
      moduleName: "AI Processing",
      status: "Success",
      message: "Draft generation completed",
      relatedRecordType: "Job",
      relatedRecordId: input.jobId,
      operationId,
      idempotencyKey,
      metadata: { documentId: String(doc._id) },
    });

    return {
      operationId,
      tenantId,
      jobId: input.jobId,
      runType: "draft-generation",
      status: "Completed",
      documentsCreated: [String(doc._id)],
      summary: "Cover letter draft generated",
      usage,
      draft: {
        documentId: String(doc._id),
        company: job.company,
        position: job.position,
        draftText: draft.draftText,
        tone: draft.tone,
        sections: ["opening", "experienceMatch", "closing"],
      },
    };
  } catch (error) {
    await JobModel.findByIdAndUpdate(job._id, {
      aiProcessingStatus: "Failed",
      aiProcessingError: error instanceof Error ? error.message : "Unknown error",
    });
    await createAutomationLog({
      tenantId,
      moduleKey: "ai-processing",
      moduleName: "AI Processing",
      status: "Failed",
      message: "Draft generation failed",
      relatedRecordType: "Job",
      relatedRecordId: input.jobId,
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function runFullAiProcessing(input: RunInput) {
  const operationId = input.operationId ?? randomUUID();
  const research = await runResearchGeneration({ ...input, operationId });
  const draft = await runDraftGeneration({ ...input, operationId });

  return {
    operationId,
    tenantId: input.tenantId,
    jobId: input.jobId,
    runType: "reply-classification" as const,
    status: "Completed" as const,
    documentsCreated: [...research.documentsCreated, ...draft.documentsCreated],
    summary: "Full AI processing completed",
    usage: {
      estimatedCredits: research.usage.estimatedCredits + draft.usage.estimatedCredits,
    },
    research,
    draft,
  };
}

export async function getAiProcessingStatus(tenantId: string, jobId: string) {
  const scopedTenantId = assertTenantId(tenantId);
  const job = await findTenantScopedById(JobModel, scopedTenantId, jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const docs = await DocumentModel.find({ tenantId: scopedTenantId, jobId }).select(
    "_id fileName documentKind generationStatus createdAt"
  );

  return {
    jobId,
    aiProcessingStatus: job.aiProcessingStatus ?? "Not Started",
    aiProcessingStartedAt: job.aiProcessingStartedAt,
    aiProcessingCompletedAt: job.aiProcessingCompletedAt,
    aiProcessingError: job.aiProcessingError,
    researchGenerated: Boolean(job.researchGenerated),
    draftGenerated: Boolean(job.draftGenerated),
    lastAiRunAt: job.lastAiRunAt,
    documents: docs.map((doc) => ({
      id: String(doc._id),
      fileName: doc.fileName,
      documentKind: doc.documentKind,
      generationStatus: doc.generationStatus,
      createdAt: doc.createdAt,
    })),
  };
}
