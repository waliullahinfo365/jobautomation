import type { JobExtractionResult, JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import type { AiProvider, AiRuntimeConfig, AiServiceResult } from "@jobflow/shared/types/ai";
import { DEFAULT_AI_MODEL } from "@jobflow/shared/constants/ai";
import {
  buildAnthropicModelCandidates,
  callAnthropicMessages,
  resolveAnthropicApiKey,
} from "./anthropic-messages";

const LOCATION_KEYWORDS = ["remote", "toronto", "vancouver", "new york", "london", "berlin", "barcelona", "madrid", "paris", "amsterdam", "berlin", "munich", "zurich", "dubai", "singapore", "sydney", "melbourne"];

// ─── Public classifier types ────────────────────────────────────────────────

export type DetectedEmailType =
  | "job_alert"
  | "recruiter_opportunity"
  | "newsletter"
  | "linkedin_update"
  | "sales_nav_notification"
  | "article"
  | "unknown";

/** @deprecated Use EmailClassificationResult */
export type EmailType = DetectedEmailType;

export interface EmailClassificationResult {
  isJob: boolean;
  confidence: number;
  reason: string;
  detectedType: DetectedEmailType;
}

/** Legacy alias kept for processor compatibility */
export interface JobIntakeClassification {
  isJobOpportunity: boolean;
  confidence: number;
  reason: string;
  emailType: DetectedEmailType;
}

// ─── Pattern tables ──────────────────────────────────────────────────────────

/** Senders that are ATS platforms — high confidence real jobs */
const ATS_SENDER_PATTERNS = [
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
  /breezy\.hr/i,
  /bamboohr\.com/i,
  /recruitee\.com/i,
];

/** Hard-reject subjects — always non-job regardless of sender */
const HARD_REJECT_SUBJECT_PATTERNS: [RegExp, DetectedEmailType][] = [
  [/people (you may know|have updates|viewed your|in your network)/i, "linkedin_update"],
  [/\d+\s*(people|connections?)\s*(viewed|visited|checked|looked at)/i, "linkedin_update"],
  [/\d+\s*new\s*(connection|follower|post|update|notification)/i, "linkedin_update"],
  [/who('s| is) viewed your/i, "linkedin_update"],
  [/(have|has) an update for you/i, "linkedin_update"],
  [/shared an? (article|post|update|thought)/i, "linkedin_update"],
  [/catch up with your network/i, "linkedin_update"],
  [/your (weekly|daily|monthly) (digest|recap|round.?up)/i, "newsletter"],
  [/in case you missed it/i, "newsletter"],
  [/top (article|post|story|news|content)/i, "newsletter"],
  [/trending (in|on|from|now)/i, "newsletter"],
  [/read on linkedin/i, "article"],
  [/sales navigator/i, "sales_nav_notification"],
  [/inmail credit/i, "sales_nav_notification"],
  [/linkedin (learning|premium|newsletter)/i, "newsletter"],
  [/your profile (appeared|was (viewed|seen)|got \d+)/i, "linkedin_update"],
  [/#\d{2,4}\s*$/i, "newsletter"], // Newsletter issue numbers like "#162"
  [/newsletter/i, "newsletter"],
  [/unsubscribe/i, "newsletter"],
];

/** Body signals that indicate a non-job email */
const HARD_REJECT_BODY_PATTERNS: [RegExp, DetectedEmailType][] = [
  [/read on linkedin/i, "article"],
  [/shared an? (article|post|update)/i, "linkedin_update"],
  [/linkedin\.com\/pulse\//i, "article"],
  [/linkedin\.com\/sales\/contract-chooser/i, "sales_nav_notification"],
  [/sales navigator/i, "sales_nav_notification"],
  [/inmail credit/i, "sales_nav_notification"],
  [/unsubscribe from this (email|newsletter|digest)/i, "newsletter"],
];

/** Strong positive signals in body */
const JOB_BODY_SIGNALS: RegExp[] = [
  /linkedin\.com\/jobs\/view\//i,
  /\b(apply now|apply here|apply with (easy apply|resume|linkedin))\b/i,
  /\b(view job|see job|view this job|see this job)\b/i,
  /\b(job description|key responsibilities|requirements|qualifications)\b/i,
  /\b(salary range|compensation|equity|base pay)\b/i,
  /https?:\/\/[^\s]*(greenhouse\.io|lever\.co|ashbyhq\.com|workday\.com|jobvite|icims|taleo)[^\s]*/i,
  /https?:\/\/[^\s]*\/(jobs?|careers?|apply|opening|vacancy|position)[^\s]*/i,
];

/** Strong positive signals in subject */
const JOB_SUBJECT_SIGNALS: RegExp[] = [
  /\bjob alert\b/i,
  /\b(your alert for|alert for)\b/i,
  /\b(is hiring|we('re| are) hiring|now hiring)\b/i,
  /\b(open role|open position|career opportunity|job opportunity)\b/i,
  /\b(apply now|apply today|apply for)\b/i,
  /\b(recruiter|talent acquisition|sourcer|headhunter)\b/i,
  /\b(vacancy|opening|position available)\b/i,
];

// ─── LinkedIn-specific routing ────────────────────────────────────────────────

function classifyLinkedInEmail(payload: JobIntakeEmailPayload): EmailClassificationResult {
  const subject = payload.subject;
  const body = payload.bodyText;

  // Sales Navigator — always reject
  if (/sales navigator/i.test(subject) || /sales navigator/i.test(body)) {
    return { isJob: false, confidence: 0.98, reason: "LinkedIn Sales Navigator notification", detectedType: "sales_nav_notification" };
  }

  // Check hard-reject subjects first
  for (const [pattern, type] of HARD_REJECT_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      return { isJob: false, confidence: 0.95, reason: `Subject pattern: ${pattern.source}`, detectedType: type };
    }
  }

  // Check hard-reject body signals
  for (const [pattern, type] of HARD_REJECT_BODY_PATTERNS) {
    if (pattern.test(body)) {
      return { isJob: false, confidence: 0.92, reason: `Body pattern: ${pattern.source}`, detectedType: type };
    }
  }

  // Now check for positive job signals — LinkedIn job alerts need strong evidence
  const hasJobUrl = /linkedin\.com\/jobs\/view\//i.test(body);
  const hasJobAlertSubject = /\b(job alert|your alert|alert for)\b/i.test(subject);
  const hasApply = /\b(apply|easy apply|view job)\b/i.test(body);
  const hasBodyJobSignals = JOB_BODY_SIGNALS.filter((p) => p.test(body)).length;
  const hasSubjectJobSignals = JOB_SUBJECT_SIGNALS.filter((p) => p.test(subject)).length;

  // LinkedIn job alert: /jobs/view/ URL + "job alert" subject or "apply" in body
  if (hasJobUrl && (hasJobAlertSubject || hasApply)) {
    const confidence = Math.min(0.97, 0.85 + (hasJobAlertSubject ? 0.05 : 0) + (hasApply ? 0.04 : 0));
    return { isJob: true, confidence, reason: "LinkedIn job alert with /jobs/view/ URL and apply signal", detectedType: "job_alert" };
  }

  // Job alert subject alone with body job signals
  if (hasJobAlertSubject && hasBodyJobSignals >= 2) {
    return { isJob: true, confidence: 0.88, reason: "LinkedIn job alert: job alert subject + multiple body signals", detectedType: "job_alert" };
  }

  // Subject-only job alert with at least one body signal
  if (hasSubjectJobSignals >= 2 && hasBodyJobSignals >= 1) {
    return { isJob: true, confidence: 0.86, reason: "LinkedIn: strong subject + body job signals", detectedType: "job_alert" };
  }

  // Article-like subjects: long title, has # number, no job words — reject
  const subjectIsArticleTitle =
    subject.length > 40 &&
    !JOB_SUBJECT_SIGNALS.some((p) => p.test(subject)) &&
    /\b(why|how|what|when|where|the|are|is)\b/i.test(subject);

  if (subjectIsArticleTitle) {
    return { isJob: false, confidence: 0.88, reason: "Subject looks like an article title, not a job posting", detectedType: "article" };
  }

  // Insufficient LinkedIn job signals — default reject
  return {
    isJob: false,
    confidence: 0.82,
    reason: "LinkedIn email lacks strong job signals (/jobs/view/ URL, job alert subject, or apply CTA)",
    detectedType: "linkedin_update",
  };
}

// ─── Main classifier ──────────────────────────────────────────────────────────

export function isRealJobOpportunity(payload: JobIntakeEmailPayload): EmailClassificationResult {
  const from = payload.from.toLowerCase();
  const subject = payload.subject;
  const body = payload.bodyText;

  // ATS platform sender — high-confidence real job
  if (ATS_SENDER_PATTERNS.some((p) => p.test(from))) {
    return { isJob: true, confidence: 0.95, reason: "Email from ATS/recruiter platform", detectedType: "job_alert" };
  }

  // LinkedIn emails — dedicated router
  if (from.includes("linkedin.com")) {
    return classifyLinkedInEmail(payload);
  }

  // Hard-reject subjects for any sender
  for (const [pattern, type] of HARD_REJECT_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      return { isJob: false, confidence: 0.92, reason: `Non-job subject: ${pattern.source}`, detectedType: type };
    }
  }

  // Hard-reject body signals for any sender
  for (const [pattern, type] of HARD_REJECT_BODY_PATTERNS) {
    if (pattern.test(body)) {
      return { isJob: false, confidence: 0.88, reason: `Non-job body signal: ${pattern.source}`, detectedType: type };
    }
  }

  // Score positive job signals
  let score = 0;
  const reasons: string[] = [];

  const subjectMatches = JOB_SUBJECT_SIGNALS.filter((p) => p.test(subject));
  if (subjectMatches.length >= 2) { score += 0.4; reasons.push("strong job subject signals"); }
  else if (subjectMatches.length === 1) { score += 0.25; reasons.push("job subject signal"); }

  const bodyMatches = JOB_BODY_SIGNALS.filter((p) => p.test(body));
  if (bodyMatches.length >= 3) { score += 0.45; reasons.push("multiple job body signals"); }
  else if (bodyMatches.length === 2) { score += 0.30; reasons.push("two job body signals"); }
  else if (bodyMatches.length === 1) { score += 0.15; reasons.push("job body signal"); }

  const hasSalary = /(\$|USD|EUR|CAD|GBP)\s?[\d,.kK]+/i.test(body);
  if (hasSalary) { score += 0.1; reasons.push("salary mention"); }

  const hasRoleAtCompany = /\b[\w\s,()-]{3,50}\s+at\s+[A-Z][A-Za-z0-9\s&.'-]{2,40}$/m.test(subject);
  if (hasRoleAtCompany) { score += 0.15; reasons.push("'Role at Company' pattern in subject"); }

  const isJob = score >= 0.85;
  const confidence = Math.min(0.97, score);
  let detectedType: DetectedEmailType = "unknown";
  if (isJob) detectedType = score >= 0.9 ? "job_alert" : "recruiter_opportunity";

  return {
    isJob,
    confidence,
    reason: isJob ? reasons.join("; ") : `Insufficient signals (score ${score.toFixed(2)})`,
    detectedType,
  };
}

/** Legacy wrapper — keeps old callers compiling */
export function classifyEmailType(payload: JobIntakeEmailPayload): JobIntakeClassification {
  const result = isRealJobOpportunity(payload);
  return {
    isJobOpportunity: result.isJob,
    confidence: result.confidence,
    reason: result.reason,
    emailType: result.detectedType,
  };
}

/**
 * Parses the first job card from a LinkedIn job alert plain-text body.
 * LinkedIn job alert bodies have repeated blocks like:
 *   Job Title\nCompany Name\nLocation\n\nView job\n\n
 */
function parseLinkedInJobCard(body: string): { position: string; company: string; location?: string } | null {
  // Split on "View job" boundaries to get individual cards
  const cardBlocks = body.split(/\bview job\b/i);
  const firstCard = cardBlocks[0];
  if (!firstCard) return null;

  // Each card: lines are position, company, location (optional)
  const lines = firstCard
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 120);

  // Skip boilerplate header lines from the email itself
  const SKIP_PATTERNS = [/^your job alert/i, /^job alert/i, /^linkedin/i, /^hi\s/i, /^\d+\s+new\s+job/i, /^here are/i, /^based on/i, /^new jobs/i, /^jobs for/i, /^matching jobs/i];
  const contentLines = lines.filter((l) => !SKIP_PATTERNS.some((p) => p.test(l)));

  if (contentLines.length < 2) return null;

  const position = contentLines[0];
  const company = contentLines[1];
  const location = contentLines[2] && !/^(apply|easy apply|see all|unsubscribe)/i.test(contentLines[2]) ? contentLines[2] : undefined;

  // Sanity check: position should look like a job title, not an article headline
  const looksLikeArticle = /\b(why|how|what|are|is|the|an|a)\b.{20,}/i.test(position) && !/\b(manager|engineer|developer|analyst|director|specialist|coordinator|designer|architect|consultant|lead|head of|vp|vice president|recruiter)\b/i.test(position);
  if (looksLikeArticle) return null;

  return { position, company, location };
}

function extractCompany(payload: JobIntakeEmailPayload): string {
  // LinkedIn job alerts — parse the actual job card, not the sender domain
  if (payload.from.toLowerCase().includes("linkedin.com")) {
    const card = parseLinkedInJobCard(payload.bodyText);
    if (card?.company && card.company.toLowerCase() !== "linkedin") return card.company;
  }

  const subjectMatch = payload.subject.match(/\bat\s+([A-Za-z0-9][A-Za-z0-9\s.&'-]{1,40})\s*$/i);
  if (subjectMatch?.[1]) return subjectMatch[1].trim();

  // Do not fall back to "linkedin" as a company name
  const domain = payload.from.split("@")[1]?.split(".")[0];
  if (!domain || domain === "linkedin" || domain === "noreply") return "Unknown Company";
  return domain.replace(/[-_]/g, " ");
}

function extractPosition(payload: JobIntakeEmailPayload): string {
  // LinkedIn job alerts — parse the actual job card
  if (payload.from.toLowerCase().includes("linkedin.com")) {
    const card = parseLinkedInJobCard(payload.bodyText);
    if (card?.position) return card.position;
  }

  const subject = payload.subject.trim();
  // Strip "job alert for X" → X is the search query, not a job title; don't use as position
  if (/^your job alert for\s+/i.test(subject)) return "Unknown Position";

  const atIndex = subject.toLowerCase().indexOf(" at ");
  if (atIndex > 0) return subject.slice(0, atIndex).trim();
  return subject || "Unknown Position";
}

/** Legacy export — deterministic extraction (no external API). */
export async function extractJobFromEmail(payload: JobIntakeEmailPayload): Promise<JobExtractionResult> {
  const isLinkedIn = payload.from.toLowerCase().includes("linkedin.com");
  const linkedInCard = isLinkedIn ? parseLinkedInJobCard(payload.bodyText) : null;

  // Prefer /jobs/view/ URL for LinkedIn, otherwise first URL in body
  const jobsViewMatch = payload.bodyText.match(/https?:\/\/[^\s)]*linkedin\.com\/jobs\/view\/[^\s)]*/i);
  const urlMatch = jobsViewMatch ?? payload.bodyText.match(/https?:\/\/[^\s)]+/i);

  const salaryMatch = payload.bodyText.match(/(?:\$|USD|CAD|EUR)\s?[\d,.kK]+(?:\s?-\s?(?:\$|USD|CAD|EUR)?\s?[\d,.kK]+)?/i);

  const locationFromCard = linkedInCard?.location;
  const locationKw = locationFromCard ?? LOCATION_KEYWORDS.find((keyword) =>
    payload.bodyText.toLowerCase().includes(keyword)
  );

  const company = extractCompany(payload);
  const position = extractPosition(payload);

  const signals = [Boolean(urlMatch), Boolean(salaryMatch), Boolean(locationKw), Boolean(payload.subject), Boolean(linkedInCard)].filter(Boolean).length;
  const confidence = Math.min(0.9, 0.6 + signals * 0.06);

  return {
    company,
    position,
    location: locationKw ? (locationKw.charAt(0).toUpperCase() + locationKw.slice(1)) : undefined,
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

const EXTRACTION_PROMPT = (payload: JobIntakeEmailPayload, base: JobExtractionResult) => `You are a job application assistant. Extract structured job data from the email below.

Return ONLY valid JSON with this exact shape (no extra keys, no markdown fences):
{
  "is_job_opportunity": true,
  "confidence": 0.0,
  "company": "",
  "position": "",
  "location": null,
  "job_url": null,
  "employment_type": null,
  "seniority": null,
  "salary": null,
  "deadline": null,
  "source_type": "unknown",
  "summary": "",
  "requirements": [],
  "skills": [],
  "reject_reason": null
}

Rules:
- is_job_opportunity: true only for real job postings/alerts/recruiter outreach. False for newsletters, updates, articles.
- company: the actual hiring company. NEVER use "linkedin" unless LinkedIn itself is hiring.
- position: exact job title. NEVER use the email subject verbatim if it's "Your job alert for X".
- source_type: one of "linkedin_job_alert" | "saved_job_reminder" | "ats_job_alert" | "direct_recruiter" | "unknown"
- If confidence < 0.85, set is_job_opportunity to false and explain in reject_reason.
- requirements and skills: max 8 items each, plain strings.
- deadline: ISO date string or null.

Pre-extracted hints (may be wrong, use your judgment):
  company hint: ${base.company}
  position hint: ${base.position}
  location hint: ${base.location ?? "none"}
  url hint: ${base.jobUrl ?? "none"}

---EMAIL FROM: ${payload.from}
SUBJECT: ${payload.subject}
BODY:
${payload.bodyText.slice(0, 3000)}`;

function parseExtractionJson(text: string): Partial<{
  is_job_opportunity: boolean;
  confidence: number;
  company: string;
  position: string;
  location: string | null;
  job_url: string | null;
  employment_type: string | null;
  seniority: string | null;
  salary: string | null;
  deadline: string | null;
  source_type: string;
  summary: string;
  requirements: string[];
  skills: string[];
  reject_reason: string | null;
}> | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch ? fenceMatch[1] : text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as ReturnType<typeof parseExtractionJson>;
  } catch {
    return null;
  }
}

export async function runAiExtraction(input: {
  payload: JobIntakeEmailPayload;
  config: AiRuntimeConfig;
}): Promise<AiServiceResult<JobExtractionResult>> {
  const base = await extractJobFromEmail(input.payload);
  const usedStub = shouldUseStub(input.config);
  const provider: AiProvider = usedStub ? "Stub" : input.config.provider;
  const body = `${input.payload.subject}\n${input.payload.bodyText}`;

  if (!usedStub) {
    const apiKey = resolveAnthropicApiKey() ?? input.config.apiKeyDecrypted;
    if (apiKey) {
      const modelCandidates = buildAnthropicModelCandidates(input.config.model);
      try {
        const result = await callAnthropicMessages({
          prompt: EXTRACTION_PROMPT(input.payload, base),
          apiKey,
          modelCandidates,
          maxTokens: 800,
          temperature: 0.1,
        });
        if (result.ok) {
          const parsed = parseExtractionJson(result.text);
          if (parsed && parsed.is_job_opportunity !== undefined) {
            const company = parsed.company?.trim() || base.company;
            const position = parsed.position?.trim() || base.position;
            const confidence = typeof parsed.confidence === "number" ? parsed.confidence : base.confidence;
            return {
              provider: "Claude",
              model: result.model,
              usedStub: false,
              confidence,
              data: {
                company: company.toLowerCase() === "linkedin" ? base.company : company,
                position,
                location: parsed.location ?? base.location,
                jobUrl: parsed.job_url ?? base.jobUrl,
                salaryRange: parsed.salary ?? base.salaryRange,
                source: payload_source(input.payload),
                confidence,
                description: parsed.summary || base.description,
                raw: base.raw,
              },
              usage: usageFromLengths(body.length, result.text.length),
            };
          }
        }
      } catch {
        // Fall through to deterministic extraction
      }
    }
  }

  return {
    provider,
    model: usedStub ? DEFAULT_AI_MODEL : (input.config.model ?? DEFAULT_AI_MODEL),
    usedStub,
    confidence: base.confidence,
    data: base,
    usage: usageFromLengths(body.length, JSON.stringify(base).length),
  };
}

function payload_source(payload: JobIntakeEmailPayload): string {
  return payload.provider ?? "email";
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
}): Promise<AiServiceResult<{
  company_overview: string;
  role_summary: string;
  candidate_match: string;
  possible_gaps: string;
  talking_points: string[];
  interview_questions: string[];
  application_strategy: string;
  sources_note: string;
  summary: string;
  promptVersion: string;
}>> {
  const apiKey = resolveAnthropicApiKey() ?? input.config.apiKeyDecrypted;
  const inText = `${input.job.company} ${input.job.position} ${input.job.description ?? ""}`;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Cannot generate research without a valid API key.");
  }

  const modelCandidates = buildAnthropicModelCandidates(input.config.model);
  const prompt = [
    "You are a career research assistant. Output ONLY valid JSON — no markdown, no commentary.",
    "Return a single JSON object with exactly these keys:",
    '  "company_overview": string',
    '  "role_summary": string',
    '  "candidate_match": string',
    '  "possible_gaps": string',
    '  "talking_points": array of strings',
    '  "interview_questions": array of strings',
    '  "application_strategy": string',
    '  "sources_note": string',
    "",
    "Base analysis ONLY on the job description. Do not invent facts.",
    "",
    `Company: ${input.job.company}`,
    `Position: ${input.job.position}`,
    `Location: ${input.job.location ?? "Not specified"}`,
    `Job description:\n${input.job.description ?? "Not provided"}`,
  ].join("\n");

  const result = await callAnthropicMessages({ prompt, apiKey, modelCandidates, maxTokens: 1500, temperature: 0.2 });
  if (!result.ok) {
    throw new Error(`Claude research generation failed: [${result.errorType}] ${result.message}`);
  }

  const cleaned = result.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned non-JSON research output");
    parsed = JSON.parse(match[0]) as Record<string, unknown>;
  }

  const data = {
    company_overview: String(parsed.company_overview ?? ""),
    role_summary: String(parsed.role_summary ?? ""),
    candidate_match: String(parsed.candidate_match ?? ""),
    possible_gaps: String(parsed.possible_gaps ?? ""),
    talking_points: Array.isArray(parsed.talking_points) ? (parsed.talking_points as string[]) : [],
    interview_questions: Array.isArray(parsed.interview_questions) ? (parsed.interview_questions as string[]) : [],
    application_strategy: String(parsed.application_strategy ?? ""),
    sources_note: String(parsed.sources_note ?? ""),
    summary: String(parsed.role_summary ?? `${input.job.company} is hiring for ${input.job.position}.`),
    promptVersion: "research-v3-claude-json",
  };

  return {
    provider: "Claude",
    model: result.model,
    usedStub: false,
    confidence: 0.9,
    data,
    usage: usageFromLengths(inText.length, result.text.length),
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
}): Promise<AiServiceResult<{
  subject: string;
  cover_letter: string;
  key_customizations: string[];
  missing_info_warnings: string[];
  draftText: string;
  promptVersion: string;
}>> {
  const apiKey = resolveAnthropicApiKey() ?? input.config.apiKeyDecrypted;
  const inText = `${input.job.company} ${input.job.position} ${input.job.description ?? ""}`;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Cannot generate cover letter without a valid API key.");
  }

  const modelCandidates = buildAnthropicModelCandidates(input.config.model);
  const tone = input.job.tone ?? "professional";
  const prompt = [
    "You are a professional cover letter writer. Output ONLY valid JSON — no markdown, no commentary.",
    "Return a single JSON object with exactly these keys:",
    '  "subject": string — email subject line for this application',
    `  "cover_letter": string — full ${tone} cover letter, 250-350 words, plain text with \\n line breaks`,
    '  "key_customizations": array of 3-5 strings — ways this letter is tailored to the role',
    '  "missing_info_warnings": array of strings — requirements in JD not addressed (empty if none)',
    "",
    "Do not fabricate credentials. Only cite experience from the job description.",
    "",
    `Company: ${input.job.company}`,
    `Position: ${input.job.position}`,
    `Job description:\n${input.job.description ?? "Not provided"}`,
  ].join("\n");

  const result = await callAnthropicMessages({ prompt, apiKey, modelCandidates, maxTokens: 1200, temperature: 0.4 });
  if (!result.ok) {
    throw new Error(`Claude cover letter generation failed: [${result.errorType}] ${result.message}`);
  }

  const cleaned = result.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned non-JSON cover letter output");
    parsed = JSON.parse(match[0]) as Record<string, unknown>;
  }

  const data = {
    subject: String(parsed.subject ?? `Application for ${input.job.position} at ${input.job.company}`),
    cover_letter: String(parsed.cover_letter ?? ""),
    key_customizations: Array.isArray(parsed.key_customizations) ? (parsed.key_customizations as string[]) : [],
    missing_info_warnings: Array.isArray(parsed.missing_info_warnings) ? (parsed.missing_info_warnings as string[]) : [],
    draftText: String(parsed.cover_letter ?? ""),
    promptVersion: "cover-letter-v3-claude-json",
  };

  return {
    provider: "Claude",
    model: result.model,
    usedStub: false,
    confidence: 0.9,
    data,
    usage: usageFromLengths(inText.length, result.text.length),
  };
}

export function estimateAiUsage(input: { runType: string; textLength?: number }) {
  const base = input.runType === "research-generation" ? 3 : input.runType === "draft-generation" ? 4 : 2;
  const textFactor = Math.max(0, Math.ceil((input.textLength ?? 0) / 1000));
  return {
    estimatedCredits: base + textFactor,
  };
}
