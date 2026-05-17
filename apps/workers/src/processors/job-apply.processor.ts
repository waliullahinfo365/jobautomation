/**
 * Job Apply processor — BullMQ worker that automates submitting a job application
 * using Playwright. Runs headless against the user's saved browser session.
 *
 * Trigger: enqueue "job-apply" with a JobApplyPayload.
 *
 * Prerequisites:
 * 1. User has run `pnpm save-session linkedin` (or indeed/greenhouse/etc.) locally.
 * 2. ANTHROPIC_API_KEY is set in Railway for form-filling AI.
 * 3. Playwright Chromium is installed in the worker Docker image.
 */

import { JobModel, UserModel, AutomationLogModel, IntegrationConnectionModel } from "@jobflow/database/models";
import { runApply } from "@jobflow/integrations/playwright";
import { detectPlatform } from "@jobflow/integrations/playwright";
import type { JobApplyPayload } from "@jobflow/shared/types/queue";
import type { UserProfile } from "@jobflow/integrations/playwright";
import { logger } from "../utils/logger";
import { serializeWorkerError } from "../utils/worker-error";

const MODULE_KEY = "job-apply";

function extractName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? name;
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

async function buildUserProfile(tenantId: string, userId?: string): Promise<UserProfile> {
  const user = userId
    ? await UserModel.findOne({ _id: userId, tenantId }).lean()
    : await UserModel.findOne({ tenantId, role: { $in: ["Owner", "Admin"] } }).lean();

  if (!user) throw new Error(`No user found for tenant ${tenantId}`);

  const u = user as Record<string, unknown>;
  const name = String(u.name ?? "Unknown User");
  const { firstName, lastName } = extractName(name);
  const prefs = (u.preferences as Record<string, unknown>) ?? {};

  return {
    firstName,
    lastName,
    email: String(u.email ?? ""),
    phone: String(prefs.phone ?? ""),
    location: String(prefs.location ?? ""),
    linkedinUrl: String(prefs.linkedinUrl ?? ""),
    websiteUrl: String(prefs.websiteUrl ?? ""),
    yearsExperience: typeof prefs.yearsExperience === "number" ? prefs.yearsExperience : undefined,
    currentTitle: String(prefs.currentTitle ?? ""),
    desiredSalary: String(prefs.desiredSalary ?? "Negotiable"),
    noticePeriod: String(prefs.noticePeriod ?? ""),
    rightToWork: typeof prefs.rightToWork === "boolean" ? prefs.rightToWork : true,
    requiresSponsorship: typeof prefs.requiresSponsorship === "boolean" ? prefs.requiresSponsorship : false,
  };
}

async function logResult(input: {
  tenantId: string;
  jobId: string;
  success: boolean;
  message: string;
  platform: string;
  stepsCompleted: number;
  operationId: string;
}): Promise<void> {
  try {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      moduleKey: MODULE_KEY,
      jobId: input.jobId,
      status: input.success ? "Success" : "Failed",
      message: `[${input.platform}] ${input.message}`,
      metadata: {
        platform: input.platform,
        stepsCompleted: input.stepsCompleted,
        operationId: input.operationId,
        source: "worker:job-apply",
      },
      createdAt: new Date(),
    });
  } catch {
    // ignore log failure
  }
}

export async function processJobApply(payload: JobApplyPayload): Promise<{
  success: boolean;
  message: string;
  platform: string;
}> {
  const operationId = payload.operationId ?? `job-apply-${Date.now()}`;

  logger.info({ jobId: payload.jobId, jobUrl: payload.jobUrl, operationId }, "Starting job-apply automation");

  // Load job for context
  const job = await JobModel.findById(payload.jobId).lean();
  if (!job) throw new Error(`Job not found: ${payload.jobId}`);

  const j = job as Record<string, unknown>;
  const jobUrl = payload.jobUrl || String(j.jobUrl ?? "");
  if (!jobUrl) throw new Error("No job URL provided");

  const platform = payload.platform ?? detectPlatform(jobUrl);

  // Build user profile from DB
  const profile = await buildUserProfile(payload.tenantId, payload.userId);

  // Attach cover letter and CV URLs from the job record if not in payload
  const coverLetterUrl = payload.coverLetterUrl || String(j.generatedCoverLetterLink ?? "");
  const cvUrl = payload.cvUrl || "";

  // Research doc as additional context
  const additionalContext = payload.additionalContext || String(j.aiSummary ?? "");

  // Update job status to "Applying"
  await JobModel.findByIdAndUpdate(payload.jobId, { status: "Applying", lastUpdated: new Date() });

  let result: Awaited<ReturnType<typeof runApply>>;
  try {
    result = await runApply({
      tenantId: payload.tenantId,
      jobId: payload.jobId,
      jobUrl,
      platform,
      profile,
      company: String(j.company ?? ""),
      position: String(j.position ?? j.title ?? ""),
      cvUrl: cvUrl || undefined,
      coverLetterUrl: coverLetterUrl || undefined,
      additionalContext: additionalContext || undefined,
      dryRun: false,
    });
  } catch (err) {
    const ser = serializeWorkerError(err);
    logger.error({ jobId: payload.jobId, err: ser.message }, "job-apply failed");

    await JobModel.findByIdAndUpdate(payload.jobId, {
      status: "New",
      lastUpdated: new Date(),
    });

    await logResult({
      tenantId: payload.tenantId,
      jobId: payload.jobId,
      success: false,
      message: `Error: ${ser.message}`,
      platform,
      stepsCompleted: 0,
      operationId,
    });

    throw err;
  }

  // Update job based on result
  if (result.success) {
    await JobModel.findByIdAndUpdate(payload.jobId, {
      status: "Applied",
      dateApplied: new Date().toISOString(),
      lastUpdated: new Date(),
    });
  } else if (result.sessionExpired) {
    await JobModel.findByIdAndUpdate(payload.jobId, {
      status: "New",
      lastUpdated: new Date(),
    });
    // Mark the LinkedIn session as expired so the Integrations panel shows a warning
    await IntegrationConnectionModel.findOneAndUpdate(
      { tenantId: payload.tenantId, provider: "playwright-session-linkedin" },
      { $set: { "metadata.sessionExpired": true, "metadata.expiredAt": new Date().toISOString() } }
    ).catch(() => void 0);
  }
  // If failed for other reason, leave as "Applying" so user can see

  await logResult({
    tenantId: payload.tenantId,
    jobId: payload.jobId,
    success: result.success,
    message: result.message,
    platform: result.platform,
    stepsCompleted: result.stepsCompleted,
    operationId,
  });

  logger.info(
    { jobId: payload.jobId, platform: result.platform, success: result.success, steps: result.stepsCompleted },
    "job-apply completed"
  );

  return { success: result.success, message: result.message, platform: result.platform };
}
