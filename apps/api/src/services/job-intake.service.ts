import { randomUUID } from "node:crypto";
import { JobModel } from "@jobflow/database/models";
import { runAiExtraction, isRealJobOpportunity } from "@jobflow/integrations/ai/ai.service";
import { createJobFingerprint } from "@jobflow/shared/utils/fingerprint";
import type { JobIntakeEmailPayload, JobIntakeResult } from "@jobflow/shared/types/job";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId } from "./baseTenant.service";
import { checkDuplicateJob } from "./duplicate-protection.service";
import { assertCanCreateJob } from "./plan-limit.service";
import { incrementUsage } from "./usage.service";
import { logAiUsage } from "./ai-usage.service";
import { resolveAiProviderForTenant } from "./ai-provider-config.service";

type ProcessInput = {
  tenantId: string;
  userId: string;
  payload: JobIntakeEmailPayload;
  operationId?: string;
  correlationId?: string;
};

function createIdempotencyKey(tenantId: string, payload: JobIntakeEmailPayload): string {
  return `job-intake:${tenantId}:${payload.providerMessageId || "no-message-id"}`;
}

export async function processJobIntakeEmail(input: ProcessInput): Promise<JobIntakeResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const logs: string[] = [];
  const idempotencyKey = createIdempotencyKey(tenantId, input.payload);

  try {
    await createAutomationLog({
      tenantId,
      moduleKey: "job-intake",
      moduleName: "Job Intake",
      status: "Running",
      message: "Job intake started",
      idempotencyKey,
      operationId,
      correlationId: input.correlationId,
      metadata: { provider: input.payload.provider },
    });
    logs.push("job-intake:start");

    const alreadyProcessed = await JobModel.findOne({
      tenantId,
      providerMessageId: input.payload.providerMessageId,
    }).select("_id");
    if (alreadyProcessed) {
      await createAutomationLog({
        tenantId,
        moduleKey: "job-intake",
        moduleName: "Job Intake",
        status: "Success",
        message: "Provider message already processed; skipped",
        relatedRecordType: "Job",
        relatedRecordId: String(alreadyProcessed._id),
        idempotencyKey,
        operationId,
        correlationId: input.correlationId,
      });
      logs.push("job-intake:skip-provider-message");

      return {
        operationId,
        tenantId,
        status: "skipped",
        jobId: String(alreadyProcessed._id),
        duplicateCheck: {
          status: "Skipped",
          duplicateScore: 1,
          reasons: ["Provider message already processed"],
        },
        logs,
      };
    }

    // Rule-based classifier runs first — fast, no API cost
    const classification = isRealJobOpportunity(input.payload);
    if (!classification.isJob) {
      logs.push(`job-intake:rejected-by-classifier:${classification.detectedType}`);
      return {
        operationId,
        tenantId,
        status: "skipped",
        duplicateCheck: { status: "Skipped", duplicateScore: 0, reasons: [`Not a job: ${classification.reason}`] },
        logs,
      };
    }

    const aiCfg = await resolveAiProviderForTenant({ tenantId });
    const extractionWrapped = await runAiExtraction({ payload: input.payload, config: aiCfg });
    const extraction = extractionWrapped.data;
    if (!extraction.company || !extraction.position) {
      throw new Error("Extraction missing required fields: company/position");
    }

    // Reject if extracted values look like platform names or marketing copy (not real job data)
    const company = extraction.company.trim();
    const position = extraction.position.trim();
    const FAKE_COMPANY_PATTERN = /^(job\s?agent|jobbörse|job\s?board|jobmail|linkedin|stepstone|xing|indeed|glassdoor|monster|email|gmail|google|slack|unknown\s*(company)?|n\/a|by confidential|confidential careers?|recruiter|anonymous|this group)$/i;
    const FAKE_COMPANY_BY_PREFIX = /^by\s+\w/i; // "By Eze Vidra", "By 3one4 Capital", "By BeautyMatter"
    const FAKE_POSITION_PATTERN = /^(jobs?\s+alerts?|job\s+alert|new job opportunit(y|ies)( for you)?|our recommendation|popular job|jobs? for you|jobs? matching|looking for candidates|join over \d+|opportunity for you|free ebook.*|payment (failure|failed).*|updated?\s+.{0,20}privacy (notice|policy)|.*capital news|content roundup.*|.*ends? in \d+ days.*|#\w.*)$/i;
    if (FAKE_COMPANY_PATTERN.test(company) || FAKE_COMPANY_BY_PREFIX.test(company)) {
      throw new Error(`Extracted company '${company}' is a platform/newsletter sender, not a hiring company`);
    }
    if (FAKE_POSITION_PATTERN.test(position)) {
      throw new Error(`Extracted position '${position}' is not a real job title`);
    }

    const fingerprintHash = createJobFingerprint({
      tenantId,
      company: extraction.company,
      position: extraction.position,
      jobUrl: extraction.jobUrl,
    });

    const existingByFingerprint = await JobModel.findOne({ tenantId, fingerprintHash }).select("_id");
    if (existingByFingerprint) {
      await createAutomationLog({
        tenantId,
        moduleKey: "duplicate-protection",
        moduleName: "Duplicate Protection",
        status: "Success",
        message: "Exact fingerprint duplicate detected",
        relatedRecordType: "Job",
        relatedRecordId: String(existingByFingerprint._id),
        idempotencyKey,
        operationId,
        correlationId: input.correlationId,
      });
      logs.push("duplicate-protection:fingerprint-duplicate");
      return {
        operationId,
        tenantId,
        status: "duplicate",
        jobId: String(existingByFingerprint._id),
        duplicateCheck: {
          status: "Duplicate",
          duplicateOfJobId: String(existingByFingerprint._id),
          duplicateScore: 1,
          reasons: ["Exact fingerprint match"],
        },
        extraction,
        logs,
      };
    }

    const duplicateCheck = await checkDuplicateJob(tenantId, extraction);
    logs.push(`duplicate-protection:${duplicateCheck.status.toLowerCase()}`);

    if (duplicateCheck.status === "Duplicate") {
      await createAutomationLog({
        tenantId,
        moduleKey: "duplicate-protection",
        moduleName: "Duplicate Protection",
        status: "Success",
        message: "Duplicate detected; job creation skipped",
        relatedRecordType: "Job",
        relatedRecordId: duplicateCheck.duplicateOfJobId,
        idempotencyKey,
        operationId,
        correlationId: input.correlationId,
        metadata: { reasons: duplicateCheck.reasons, score: duplicateCheck.duplicateScore },
      });
      return {
        operationId,
        tenantId,
        status: "duplicate",
        jobId: duplicateCheck.duplicateOfJobId,
        duplicateCheck,
        extraction,
        logs,
      };
    }

    await assertCanCreateJob(tenantId);

    const created = await JobModel.create({
      tenantId,
      createdBy: input.userId || "system",
      company: extraction.company,
      position: extraction.position,
      location: extraction.location,
      jobUrl: extraction.jobUrl,
      salaryRange: extraction.salaryRange,
      deadline: extraction.deadline ? new Date(extraction.deadline) : undefined,
      contactEmail: extraction.contactEmail,
      description: extraction.description,
      source: extraction.source,
      status: "New",
      priority: "Medium",
      fingerprintHash,
      intakeSource: input.payload.provider,
      providerMessageId: input.payload.providerMessageId,
      providerThreadId: input.payload.providerThreadId,
      extractedFromEmail: true,
      extractionConfidence: extraction.confidence,
      duplicateStatus: duplicateCheck.status,
      duplicateScore: duplicateCheck.duplicateScore,
      duplicateOfJobId: duplicateCheck.duplicateOfJobId,
      rawSourceData: {
        payload: input.payload.raw ?? {},
        extractionRaw: extraction.raw ?? {},
        extractionAi: {
          provider: extractionWrapped.provider,
          model: extractionWrapped.model,
          usedStub: extractionWrapped.usedStub,
        },
      },
    });

    await incrementUsage({ tenantId, metric: "jobsCount", amount: 1 });

    await logAiUsage({
      tenantId,
      userId: input.userId,
      provider: extractionWrapped.provider,
      model: extractionWrapped.model,
      runType: "job-extraction",
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: String(created._id),
      inputText: `${input.payload.subject}\n${input.payload.bodyText}`,
      outputText: JSON.stringify(extraction),
      usedStub: extractionWrapped.usedStub,
    });

    await createAutomationLog({
      tenantId,
      moduleKey: "job-intake",
      moduleName: "Job Intake",
      status: "Success",
      message: "Job intake processed successfully",
      relatedRecordType: "Job",
      relatedRecordId: String(created._id),
      idempotencyKey,
      operationId,
      correlationId: input.correlationId,
    });
    await createAutomationLog({
      tenantId,
      moduleKey: "duplicate-protection",
      moduleName: "Duplicate Protection",
      status: "Success",
      message: "Duplicate evaluation completed",
      relatedRecordType: "Job",
      relatedRecordId: String(created._id),
      idempotencyKey,
      operationId,
      correlationId: input.correlationId,
      metadata: { reasons: duplicateCheck.reasons, score: duplicateCheck.duplicateScore },
    });
    logs.push("job-intake:success");

    return {
      operationId,
      tenantId,
      status: "created",
      jobId: String(created._id),
      duplicateCheck,
      extraction,
      logs,
    };
  } catch (error) {
    await createAutomationLog({
      tenantId,
      moduleKey: "job-intake",
      moduleName: "Job Intake",
      status: "Failed",
      message: "Job intake failed",
      idempotencyKey,
      operationId,
      correlationId: input.correlationId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      operationId,
      tenantId,
      status: "failed",
      duplicateCheck: {
        status: "Skipped",
        duplicateScore: 0,
        reasons: ["Intake failed before duplicate processing completed"],
      },
      logs: [...logs, "job-intake:failed"],
    };
  }
}
