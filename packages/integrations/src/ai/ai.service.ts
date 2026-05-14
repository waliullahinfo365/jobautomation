import type { JobExtractionResult, JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import type { AiProvider, AiRuntimeConfig, AiServiceResult } from "@jobflow/shared/types/ai";
import { DEFAULT_AI_MODEL } from "@jobflow/shared/constants/ai";

const LOCATION_KEYWORDS = ["remote", "toronto", "vancouver", "new york", "london", "berlin"];

export type EmailType = "job_alert" | "recruiter_opportunity" | "newsletter" | "notification" | "marketing" | "unknown";

export interface JobIntakeClassification {
  isJobOpportunity: boolean;
  confidence: number;
  reason: string;
  emailType: EmailType;
}

const NON_JOB_SENDERS = [
  "linkedin.com",
  "sales.linkedin.com",
  "notifications.linkedin.com",
  "e.linkedin.com",
  "news.linkedin.com",
  "noreply@",
  "no-reply@",
  "digest@",
  "newsletter@",
  "updates@",
  "notifications@",
  "alert@",
  "info@linkedin",
  "jobs-listings@linkedin",
];

const NON_JOB_SUBJECT_PATTERNS = [
  /your (weekly|daily|monthly) digest/i,
  /people (you may know|viewed your|in your network|have updates)/i,
  /\d+ (people|connections?) (viewed|visited|checked)/i,
  /\d+ new (connection|follower|post|update|notification)/i,
  /who('s| is) viewed your/i,
  /sales navigator/i,
  /inmail credit/i,
  /linkedin learning/i,
  /linkedin premium/i,
  /your profile (appeared|was|got)/i,
  /catch up with/i,
  /stay connected/i,
  /network (update|news|digest)/i,
  /trending (in|on|from)/i,
  /top (article|post|news|update)/i,
  /newsletter/i,
  /unsubscribe/i,
  /you have \d+ new message/i,
  /\d+ (jobs? based on|jobs? matching|similar jobs?)/i,
  /(article|post|news) from your/i,
];

const JOB_SUBJECT_PATTERNS = [
  /\b(is hiring|we('re| are) hiring|now hiring)\b/i,
  /\b(job alert|job opportunity|career opportunity|open role|open position)\b/i,
  /\b(apply now|apply today|application for|apply for)\b/i,
  /\b(recruiter|talent acquisition|sourcer|headhunter)\b/i,
  /\b(interview|screening call|phone screen|take-home|technical test)\b/i,
  /\b(offer|compensation|salary|equity|base pay)\b/i,
  /\b(position|role|vacancy|opening)\b.{0,40}\b(at|@|for)\b/i,
];

const JOB_BODY_PATTERNS = [
  /\b(apply now|apply here|submit your application|click to apply)\b/i,
  /\b(job description|responsibilities|requirements|qualifications|nice to have)\b/i,
  /\b(compensation|salary range|equity|bonus|benefits)\b/i,
  /\b(interview process|hiring process|next steps?)\b/i,
  /\bhttps?:\/\/[^\s]*\/(job|career|apply|position|opening|vacancy)[^\s]*/i,
];

const RECRUITER_SENDER_PATTERNS = [
  /greenhouse\.io/i,
  /lever\.co/i,
  /workday\.com/i,
  /jobvite\.com/i,
  /icims\.com/i,
  /taleo\.net/i,
  /smartrecruiters\.com/i,
  /ashbyhq\.com/i,
  /dover\.io/i,
  /gem\.com/i,
];

export function classifyEmailType(payload: JobIntakeEmailPayload): JobIntakeClassification {
  const from = payload.from.toLowerCase();
  const subject = payload.subject.toLowerCase();
  const body = payload.bodyText.toLowerCase();

  // Hard-reject: known non-job senders
  const isNonJobSender = NON_JOB_SENDERS.some((s) => from.includes(s));
  if (isNonJobSender) {
    const isLinkedIn = from.includes("linkedin.com");
    // LinkedIn can send job alerts too — check subject before hard-rejecting
    const hasJobSubject = JOB_SUBJECT_PATTERNS.some((p) => p.test(payload.subject));
    if (!hasJobSubject) {
      return {
        isJobOpportunity: false,
        confidence: 0.95,
        reason: `Non-job sender: ${from}`,
        emailType: isLinkedIn ? "notification" : "marketing",
      };
    }
  }

  // Hard-reject: non-job subject patterns
  for (const pattern of NON_JOB_SUBJECT_PATTERNS) {
    if (pattern.test(payload.subject)) {
      return {
        isJobOpportunity: false,
        confidence: 0.9,
        reason: `Subject matches non-job pattern: "${pattern.source}"`,
        emailType: "newsletter",
      };
    }
  }

  // Score positive signals
  let score = 0;
  const reasons: string[] = [];

  const jobSubjectMatches = JOB_SUBJECT_PATTERNS.filter((p) => p.test(payload.subject));
  if (jobSubjectMatches.length > 0) {
    score += 0.35;
    reasons.push("job subject keywords");
  }

  const jobBodyMatches = JOB_BODY_PATTERNS.filter((p) => p.test(payload.bodyText));
  if (jobBodyMatches.length >= 2) {
    score += 0.3;
    reasons.push("multiple job body signals");
  } else if (jobBodyMatches.length === 1) {
    score += 0.15;
    reasons.push("job body signal");
  }

  const isAts = RECRUITER_SENDER_PATTERNS.some((p) => p.test(from));
  if (isAts) {
    score += 0.4;
    reasons.push("ATS/recruiter sender domain");
  }

  const hasJobUrl = /https?:\/\/[^\s]*(job|career|apply|position|opening|lever|greenhouse|ashby|workday)[^\s]*/i.test(payload.bodyText);
  if (hasJobUrl) {
    score += 0.2;
    reasons.push("job application URL");
  }

  const hasSalary = /(\$|USD|EUR|CAD|GBP)\s?[\d,.kK]+/i.test(payload.bodyText);
  if (hasSalary) {
    score += 0.1;
    reasons.push("salary mention");
  }

  const hasAtPattern = / at [A-Z][a-zA-Z0-9\s&.'-]{2,40}$/i.test(payload.subject);
  if (hasAtPattern) {
    score += 0.15;
    reasons.push("'role at Company' subject pattern");
  }

  const isJobOpportunity = score >= 0.35;
  const confidence = Math.min(0.97, score);

  let emailType: EmailType = "unknown";
  if (isAts || score >= 0.7) emailType = "job_alert";
  else if (score >= 0.35) emailType = "recruiter_opportunity";

  return {
    isJobOpportunity,
    confidence,
    reason: isJobOpportunity ? reasons.join("; ") : "insufficient job signals",
    emailType,
  };
}

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
