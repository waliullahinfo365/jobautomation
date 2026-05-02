import type { JobExtractionResult, JobIntakeEmailPayload } from "@shared/types/job";
import type { AiProvider, AiRuntimeConfig, AiServiceResult } from "@shared/types/ai";
import { DEFAULT_AI_MODEL } from "@shared/constants/ai";

const LOCATION_KEYWORDS = ["remote", "toronto", "vancouver", "new york", "london", "berlin"];

function extractCompany(payload: JobIntakeEmailPayload): string {
  const subjectMatch = payload.subject.match(/at\s+([A-Za-z0-9\s.&-]+)/i);
  if (subjectMatch?.[1]) return subjectMatch[1].trim();
  const domain = payload.from.split("@")[1]?.split(".")[0];
  return domain ? domain.replace(/[-_]/g, " ") : "Unknown Company";
}

function extractPosition(payload: JobIntakeEmailPayload): string {
  const subject = payload.subject.trim();
  const atIndex = subject.toLowerCase().indexOf(" at ");
  if (atIndex > 0) return subject.slice(0, atIndex).trim();
  return subject || "Unknown Position";
}

/** Legacy export — deterministic extraction (no external API). */
export async function extractJobFromEmail(payload: JobIntakeEmailPayload): Promise<JobExtractionResult> {
  const urlMatch = payload.bodyText.match(/https?:\/\/[^\s)]+/i);
  const salaryMatch = payload.bodyText.match(/(?:\$|USD|CAD|EUR)\s?[\d,.kK]+(?:\s?-\s?(?:\$|USD|CAD|EUR)?\s?[\d,.kK]+)?/i);
  const locationKw = LOCATION_KEYWORDS.find((keyword) =>
    payload.bodyText.toLowerCase().includes(keyword)
  );

  const signals = [Boolean(urlMatch), Boolean(salaryMatch), Boolean(locationKw), Boolean(payload.subject)].filter(Boolean).length;
  const confidence = Math.min(0.9, 0.6 + signals * 0.075);

  return {
    company: extractCompany(payload),
    position: extractPosition(payload),
    location: locationKw ? locationKw.charAt(0).toUpperCase() + locationKw.slice(1) : undefined,
    jobUrl: urlMatch?.[0],
    salaryRange: salaryMatch?.[0],
    source: payload.provider,
    confidence,
    description: payload.bodyText.slice(0, 1000),
    raw: {
      from: payload.from,
      subject: payload.subject,
    },
  };
}

function shouldUseStub(config: AiRuntimeConfig): boolean {
  return config.provider === "Stub" || config.fallbackToStub || !config.apiKeyDecrypted;
}

function usageFromLengths(inputLen: number, outputLen: number) {
  const input = Math.max(1, Math.ceil(inputLen / 4));
  const output = Math.max(1, Math.ceil(outputLen / 4));
  return {
    estimatedInputTokens: input,
    estimatedOutputTokens: output,
    estimatedCost: 0,
  };
}

/**
 * Tenant-aware job extraction. Uses deterministic stub unless real providers are enabled later.
 * TODO: When `shouldUseStub` is false and API keys exist, call OpenAI/Anthropic SDK here.
 */
export async function runAiExtraction(input: {
  payload: JobIntakeEmailPayload;
  config: AiRuntimeConfig;
}): Promise<AiServiceResult<JobExtractionResult>> {
  const base = await extractJobFromEmail(input.payload);
  const usedStub = shouldUseStub(input.config);
  const provider: AiProvider = usedStub ? "Stub" : input.config.provider;
  const model = usedStub ? DEFAULT_AI_MODEL : input.config.model;

  if (!usedStub && input.config.apiKeyDecrypted) {
    // TODO: real LLM extraction — return stub data with configured provider metadata for now.
  }

  const body = `${input.payload.subject}\n${input.payload.bodyText}`;
  return {
    provider,
    model,
    usedStub,
    confidence: base.confidence,
    data: base,
    usage: usageFromLengths(body.length, JSON.stringify(base).length),
  };
}

/** Legacy export — deterministic research. */
export async function generateJobResearch(input: {
  company: string;
  position: string;
  description?: string;
  location?: string;
  promptVersion?: string;
}) {
  const summary = `${input.company} appears to be hiring for ${input.position}${input.location ? ` in ${input.location}` : ""}. Focus your application on measurable impact and role-fit signals.`;
  const keyRequirements = [
    `Demonstrated experience aligned with ${input.position}`,
    "Strong communication and collaboration",
    "Ownership mindset with delivery track record",
  ];
  const companyResearch = `${input.company} is presented as an active hiring organization. Prioritize alignment to mission, team fit, and direct contributions.`;
  const talkingPoints = [
    "Highlight business outcomes and metrics",
    "Show role-specific technical depth",
    "Connect prior projects to current needs",
  ];

  return {
    summary,
    keyRequirements,
    companyResearch,
    talkingPoints,
    confidence: 0.78,
    promptVersion: input.promptVersion ?? "research-v1-stub",
  };
}

export async function runResearchGeneration(input: {
  job: { company: string; position: string; description?: string; location?: string };
  config: AiRuntimeConfig;
}): Promise<AiServiceResult<Awaited<ReturnType<typeof generateJobResearch>>>> {
  const usedStub = shouldUseStub(input.config);
  const provider: AiProvider = usedStub ? "Stub" : input.config.provider;
  const model = usedStub ? DEFAULT_AI_MODEL : input.config.model;

  if (!usedStub && input.config.apiKeyDecrypted) {
    // TODO: OpenAI / Claude research call
  }

  const data = await generateJobResearch({
    company: input.job.company,
    position: input.job.position,
    description: input.job.description,
    location: input.job.location,
  });

  const inText = `${input.job.company} ${input.job.position} ${input.job.description ?? ""}`;
  return {
    provider,
    model,
    usedStub,
    confidence: data.confidence,
    data,
    usage: usageFromLengths(inText.length, data.summary.length + data.companyResearch.length),
  };
}

/** Legacy export — deterministic cover letter. */
export async function generateCoverLetterDraft(input: {
  company: string;
  position: string;
  description?: string;
  tone?: "professional" | "confident" | "friendly";
  promptVersion?: string;
}) {
  const tone = input.tone ?? "professional";
  const opening = `Dear Hiring Team at ${input.company},`;
  const experienceMatch = `I am excited to apply for the ${input.position} role. My background includes shipping projects with clear business outcomes and collaborating across teams.`;
  const closing = "Thank you for your time and consideration. I would welcome the opportunity to discuss how I can contribute.";
  const draftText = [opening, "", experienceMatch, "", closing].join("\n");

  return {
    draftText,
    opening,
    experienceMatch,
    closing,
    tone,
    confidence: 0.74,
    promptVersion: input.promptVersion ?? "cover-letter-v1-stub",
  };
}

export async function runCoverLetterGeneration(input: {
  job: { company: string; position: string; description?: string; tone?: "professional" | "confident" | "friendly" };
  config: AiRuntimeConfig;
}): Promise<AiServiceResult<Awaited<ReturnType<typeof generateCoverLetterDraft>>>> {
  const usedStub = shouldUseStub(input.config);
  const provider: AiProvider = usedStub ? "Stub" : input.config.provider;
  const model = usedStub ? DEFAULT_AI_MODEL : input.config.model;

  if (!usedStub && input.config.apiKeyDecrypted) {
    // TODO: OpenAI / Claude draft call
  }

  const data = await generateCoverLetterDraft({
    company: input.job.company,
    position: input.job.position,
    description: input.job.description,
    tone: input.job.tone,
  });

  const inText = `${input.job.company} ${input.job.position} ${input.job.description ?? ""}`;
  return {
    provider,
    model,
    usedStub,
    confidence: data.confidence,
    data,
    usage: usageFromLengths(inText.length, data.draftText.length),
  };
}

export function estimateAiUsage(input: { runType: string; textLength?: number }) {
  const base = input.runType === "research-generation" ? 3 : input.runType === "draft-generation" ? 4 : 2;
  const textFactor = Math.max(0, Math.ceil((input.textLength ?? 0) / 1000));
  return {
    estimatedCredits: base + textFactor,
  };
}
