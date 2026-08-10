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

/**
 * Senders that are SaaS marketing tools / ad networks / non-job platforms.
 * These never send real job postings — always marketing.
 */
const MARKETING_SENDER_PATTERNS: RegExp[] = [
  /stackadapt\.com/i,
  /aiapply\.(co|com|io)/i,
  /jobswipe\.(co|com|io)/i,
  /jobagentic\.(com|io)/i,
  /mailchimp\.com/i,
  /sendgrid\.net/i,
  /constantcontact\.com/i,
  /hubspotemail\.net/i,
  /marketo\.com/i,
  /klaviyo\.com/i,
  /activecampaign\.com/i,
  /sendinblue\.com/i,
  /brevo\.com/i,
  /reply\.io/i,
  /lemlist\.com/i,
  /outreach\.io/i,
  /salesloft\.com/i,
  // Job aggregator/digest platforms — send multi-job digests, not single postings
  /jobagent\.(de|com|at|ch|io)/i,
  /job-agent\.(de|com|at|ch|io)/i,
  /jobrecommend\./i,
  /jobnotify\./i,
  /talentalert\./i,
  /jobalarm\./i,
];

/** Senders that are ATS platforms — high confidence real jobs */
// ATS applicant-tracking systems only — NOT job boards (job boards have their own classifier)
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
  // Explicit promotional / event subjects — not recruiter outreach
  [/\b(webinar|conference|summit|workshop|event|meetup)\b/i, "newsletter"],
  [/\b(discount|promo|coupon|sale|offer ends|% off)\b/i, "newsletter"],
  [/\b(product update|release notes|changelog|new feature)\b/i, "newsletter"],
  // Ebook / content marketing
  [/\bfree ebook\b/i, "newsletter"],
  [/\b(download|get) (your )?(free |our )?(ebook|guide|whitepaper|report|checklist|template)\b/i, "newsletter"],
  // Payment / billing / financial emails
  [/\bpayment (failure|failed|declined|unsuccessful|overdue|past due)\b/i, "newsletter"],
  [/\b(your (payment|invoice|bill|charge|subscription) (failed|is due|has been|was (charged|processed|declined)))\b/i, "newsletter"],
  [/\b(google workspace|microsoft 365|office 365) (billing|subscription|payment|invoice)\b/i, "newsletter"],
  // Community / forum / group moderation
  [/\bplease read the rules before posting\b/i, "newsletter"],
  [/\b(this group is|this community is) (actively )?(managed|moderated)\b/i, "newsletter"],
  // Generic job-alert subjects (email subject used verbatim, no real title)
  [/^jobs?\s+alert$/i, "newsletter"],
  [/^job\s+alerts?$/i, "newsletter"],
  // Privacy / legal update subjects
  [/\b(updated?|new)\s+(privacy|terms|legal)\s+(notice|policy|update|agreement)\b/i, "newsletter"],
  // VC / investor newsletter subjects
  [/\b(capital|ventures?|fund|investor)\s+news\b/i, "newsletter"],
  [/\bcontent\s+roundup\b/i, "newsletter"],
  // SaaS trial ending
  [/\bfree trial (of .{3,40})?ends? in \d+\s*days?\b/i, "newsletter"],
  [/\b(your|benjaminkueper'?s?) (free trial|trial) (of .{3,30})?ends?\b/i, "newsletter"],
  // SaaS tool marketing emails (credits, billing, trial, subscription)
  [/\b(credit|credits|trial|subscription|upgrade|plan|billing|invoice|receipt|payment)\b/i, "newsletter"],
  [/\b(ends (today|soon|may|june|july|this week)|expires|expiring|last chance|limited time)\b/i, "newsletter"],
  [/\b(summer support|spring offer|black friday|cyber monday)\b/i, "newsletter"],
  // GDPR / legal / consent emails — not jobs
  [/\b(consent to retain|data retention|privacy policy|terms of service|terms of use|gdpr|dsgvo)\b/i, "newsletter"],
  [/\b(retain your (application |account |personal )?data)\b/i, "newsletter"],
  // Promotional job-adjacent marketing
  [/\b(join over \d+|over \d+ applicants|popular job|trending job|hot job)\b/i, "newsletter"],
  [/\bthe best jobs are right here\b/i, "newsletter"],
  [/\bcold email\b/i, "newsletter"],
  [/\b(most .{3,30} (start|begin|end) with)\b/i, "newsletter"],
  // Account notifications — not jobs
  [/\b(account (update|security|verify|verification|confirmed|created|deleted|suspended))\b/i, "newsletter"],
  [/\b(password (reset|changed|updated))\b/i, "newsletter"],
  [/\b(your (order|purchase|subscription|invoice|receipt))\b/i, "newsletter"],
  // Digest / multi-job recommendation emails — not a single real job posting
  [/\d+\s+(other\s+)?(companies|employers|firms|jobs?|positions?)\s+(are\s+)?(looking for|hiring)/i, "newsletter"],
  [/companies (are|have been) looking for candidates like you/i, "newsletter"],
  [/\bour recommendation\b/i, "newsletter"],
  [/\bnew job opportunity for you\b/i, "newsletter"],
  [/\b(we found|we have found|we('ve| have) selected)\s+\d+\s+(jobs?|positions?|matches?|results?)/i, "newsletter"],
  [/\b(jobs? that match(es)? your (profile|search|preferences)|matching jobs? for you)\b/i, "newsletter"],
  [/\b(top \d+ jobs?|latest \d+ jobs?|\d+ new jobs? for you)\b/i, "newsletter"],
  [/\b(empfohlene|empfehlung|unsere empfehlung|wir empfehlen)\b/i, "newsletter"],
  [/\b\d+\s+unternehmen (suchen|sucht)\b/i, "newsletter"],
  [/\bpassende stellen für sie\b/i, "newsletter"],
  // Agency / recruitment status updates — not a specific job posting
  [/\bupdate on your job search\b/i, "newsletter"],
  [/\byour job search (in|for|update)\b/i, "newsletter"],
  [/\b(status|update) (of|on) your (job search|application|cv|resume)\b/i, "newsletter"],
  [/\b(checking in|follow.?up) (on|about) your (job search|application|cv)\b/i, "newsletter"],
  [/\bhow is your job search\b/i, "newsletter"],
  [/\bany (news|update) (on|about) your (job search|application)\b/i, "newsletter"],
  [/\bwe('ve| have) (an )?update (for you|about your job search)\b/i, "newsletter"],
];

/** Body signals that indicate a non-job email */
const HARD_REJECT_BODY_PATTERNS: [RegExp, DetectedEmailType][] = [
  [/read on linkedin/i, "article"],
  [/shared an? (article|post|update)/i, "linkedin_update"],
  [/linkedin\.com\/pulse\//i, "article"],
  [/linkedin\.com\/sales\/contract-chooser/i, "sales_nav_notification"],
  [/sales navigator/i, "sales_nav_notification"],
  [/inmail credit/i, "sales_nav_notification"],
  [/unsubscribe from this newsletter/i, "newsletter"],
  [/you('re| are) receiving this (email|newsletter) because you subscribed/i, "newsletter"],
  // GDPR / data consent body signals
  [/\b(we('re| are) required by law|data protection|retention period|right to be forgotten|right to erasure)\b/i, "newsletter"],
  [/\b(consent to (store|retain|process|keep) your (personal |application |account )?data)\b/i, "newsletter"],
  // SaaS marketing body signals — credits, trial endings, product promo
  [/\b(your (free trial|trial period|subscription) (expires?|ends?|has ended|will end))\b/i, "newsletter"],
  [/\b(\d+\s+(free |extra |bonus )?credits?)\b/i, "newsletter"],
  [/\b(upgrade (your plan|to (pro|premium|business|enterprise)))\b/i, "newsletter"],
  // Social-proof marketing (not actual job postings)
  [/\bjoin over \d+\s*(applicants?|candidates?|users?|members?|people)\b/i, "newsletter"],
  [/\bover \d+\s*(companies|employers|recruiters) (are|have)\b/i, "newsletter"],
  // Cold email / outreach tool marketing
  [/\b(open rate|click rate|deliverability|email sequence|warm-up|inbox placement)\b/i, "newsletter"],
  [/\b(cold email|outreach tool|sales outreach|lead generation|prospect)\b/i, "newsletter"],
  // Community / forum / group emails
  [/\bplease read the rules before posting\b/i, "newsletter"],
  [/\b(this group is|this community is) (actively )?(managed|moderated)\b/i, "newsletter"],
  [/\bsign up for (our|this) (email )?newsletter\b/i, "newsletter"],
  [/\bfor more (regular )?updates.{0,40}sign up\b/i, "newsletter"],
  // Billing / payment body signals
  [/\bpayment (method|failed|failure|declined|past due)\b/i, "newsletter"],
  [/\byour (google workspace|microsoft 365|office 365|dropbox|slack|zoom) (account|subscription|billing)\b/i, "newsletter"],
  // Ebook / content download body
  [/\b(download|access|get) (your )?(free )?(ebook|guide|whitepaper|report|checklist)\b/i, "newsletter"],
  [/\bupdate on your job search\b/i, "newsletter"],
  [/\b(status of your|update on your) (job search|application|cv|resume)\b/i, "newsletter"],
];

/** Strong positive signals in body */
const JOB_BODY_SIGNALS: RegExp[] = [
  /linkedin\.com\/jobs\/view\//i,
  /\b(apply now|apply here|apply with (easy apply|resume|linkedin))\b/i,
  /\b(view job|see job|view this job|see this job)\b/i,
  /\b(job description|key responsibilities|requirements|qualifications)\b/i,
  /\b(salary range|compensation|equity|base pay)\b/i,
  /https?:\/\/[^\s]*(greenhouse\.io|lever\.co|ashbyhq\.com|workday\.com|jobvite|icims|taleo)[^\s]*/i,
  /https?:\/\/[^\s]*\/(jobs?|careers?|opening|vacancy|position)[^\s]*/i,
  // Direct recruiter outreach phrases
  /\b(i (came across|noticed|found|saw) your (profile|background|experience|linkedin))\b/i,
  /\b(we('re| are) looking for|we have an? (opening|role|position|opportunity) for)\b/i,
  /\b(would you be (open|interested) (to|in) (exploring|discussing|learning|hearing))\b/i,
  /\b(full.time|contract|permanent|hybrid|remote.first)\b.{0,60}\b(role|position|opportunity)\b/i,
  // German job signals
  /\b(jetzt bewerben|bewerbung einreichen|zur stellenanzeige|stelle ansehen)\b/i,
  /\b(stellenangebot|stellenanzeige|jobangebot|vakanz|freie stelle)\b/i,
  /\b(vollzeit|teilzeit|festanstellung|unbefristet|befristet)\b/i,
  /\b(gehalt|jahresgehalt|vergütung|lohn)\b/i,
  /\b(aufgaben|anforderungen|qualifikationen|ihr profil|deine aufgaben)\b/i,
  /stepstone\.(de|at|com|co\.uk)/i,
  /xing\.com\/jobs/i,
  /\b(ich bin interessiert|jetzt bewerben)\b/i,
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
  /\b(interested in|exploring|opportunity for you)\b/i,
  /\b(full.?time|contract|permanent)\s+(role|position|opportunity)\b/i,
  // "Role at Company" anywhere in subject (not just end-of-line)
  /\b[\w\s,()-]{3,40}\s+at\s+[A-Z][A-Za-z0-9\s&.'-]{2,40}\b/,
  // German subject signals
  /\b(jobalert|job-alert|stellenangebot|neue stelle|passende jobs)\b/i,
  /\b(jetzt bewerben|bewerbung|vakanz)\b/i,
  /\b(w\/m\/d|m\/w\/d|m\/f\/d)\b/i,
  /\b(dein(e)? neue(r)? job|neue jobs für dich|passende stellen)\b/i,
];

// ─── LinkedIn-specific routing ────────────────────────────────────────────────

function classifyLinkedInEmail(payload: JobIntakeEmailPayload): EmailClassificationResult {
  const subject = payload.subject;
  const body = payload.bodyText;
  const from = payload.from.toLowerCase();

  // Sales Navigator — always reject
  if (/sales navigator/i.test(subject) || /sales navigator/i.test(body)) {
    return { isJob: false, confidence: 0.98, reason: "LinkedIn Sales Navigator notification", detectedType: "sales_nav_notification" };
  }

  // jobalerts-noreply@linkedin.com is LinkedIn's dedicated job alert sender — always a job
  if (from.includes("jobalerts-noreply@linkedin.com")) {
    return { isJob: true, confidence: 0.95, reason: "LinkedIn Job Alerts sender (jobalerts-noreply)", detectedType: "job_alert" };
  }

  // Subject format "[Role] at [Company]" is LinkedIn's standard single-job alert format
  if (
    /^.{3,80}\s+at\s+.{2,60}$/i.test(subject.trim()) &&
    !/(accepted|messaged|viewed|connected|update|invitation|just messaged)/i.test(subject)
  ) {
    return { isJob: true, confidence: 0.90, reason: "LinkedIn subject matches '[Role] at [Company]' format", detectedType: "job_alert" };
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

// ─── Job board sender → source name map ──────────────────────────────────────

// German job boards listed first — client is German-market
const JOB_BOARD_SOURCE_MAP: [RegExp, string][] = [
  // ── German / DACH primary ──
  [/stepstone\.(de|at|be|nl|fr|co\.uk|com)/i, "Stepstone"],
  [/xing(-mail)?\.com/i, "Xing"],
  [/jobware\.de/i, "Jobware"],
  [/stellenanzeigen\.de/i, "Stellenanzeigen.de"],
  [/meinestadt\.de/i, "Meinestadt.de"],
  [/jobbörse\.de/i, "Jobbörse"],
  [/arbeitsagentur\.de/i, "Arbeitsagentur"],
  [/interamt\.de/i, "Interamt"],
  [/yourfirm\.de/i, "YourFirm"],
  [/absolventa\.de/i, "Absolventa"],
  [/academics\.de/i, "Academics"],
  [/kimeta\.de/i, "Kimeta"],
  [/experteer\.(de|com)/i, "Experteer"],
  [/hogast\.at/i, "Hogast"],
  // ── Austria / Switzerland ──
  [/karriere\.at/i, "Karriere.at"],
  [/jobs\.ch/i, "Jobs.ch"],
  [/jobscout24\.(de|ch|at)/i, "JobScout24"],
  // ── Global ──
  [/indeed\.(com|de|co\.uk|fr|at|ch)/i, "Indeed"],
  [/glassdoor\.(com|de|co\.uk|fr)/i, "Glassdoor"],
  [/monster\.(de|com|co\.uk|fr|at)/i, "Monster"],
  [/linkedin\./i, "LinkedIn"],
  [/indeedemail\.com/i, "Indeed"],
];

export function detectJobBoardSource(from: string): string {
  const f = from.toLowerCase();
  for (const [pattern, name] of JOB_BOARD_SOURCE_MAP) {
    if (pattern.test(f)) return name;
  }
  return "email";
}

export function isJobBoardSender(from: string): boolean {
  const f = from.toLowerCase();
  return JOB_BOARD_SOURCE_MAP.some(([pattern]) => pattern.test(f));
}

export function resolveJobSourceFromEmail(from: string, sourceType?: string): string {
  const detected = detectJobBoardSource(from);
  if (detected !== "email") return detected;

  const typeMap: Record<string, string> = {
    linkedin_job_alert: "LinkedIn",
    stepstone_job_alert: "Stepstone",
    xing_job_alert: "Xing",
    indeed_job_alert: "Indeed",
    glassdoor_job_alert: "Glassdoor",
    monster_job_alert: "Monster",
    job_board_alert: "Other",
    ats_job_alert: "Company Website",
    direct_recruiter: "Referral",
  };
  if (sourceType && typeMap[sourceType]) return typeMap[sourceType];
  if (ATS_SENDER_PATTERNS.some((p) => p.test(from))) return "Company Website";
  return "Gmail";
}

const FAKE_COMPANY_EXACT =
  /^(job\s?agent|jobbörse|job\s?board|jobmail|linkedin|stepstone|xing|indeed|glassdoor|monster|email|gmail|google|slack|unknown\s*(company)?|n\/a|by confidential|confidential careers?|recruiter|anonymous|this group|employment agency|recruitment agency|staffing agency|placement agency|personnel agency|job search agency|job search service|career service|your recruiter|headhunting agency|recruiting firm)$/i;
const FAKE_COMPANY_BY_PREFIX = /^by\s+\w/i;
const INVALID_COMPANY_PATTERNS = [
  /^(employment|recruitment|staffing|placement|personnel|job search|job hunt|career) (agency|service|consultant|advisor|firm)s?$/i,
  /\b(employment|recruitment|staffing) agency\b/i,
];

const FAKE_POSITION_EXACT =
  /^(jobs?\s+alerts?|job\s+alert|new job opportunit(y|ies)( for you)?|our recommendation|popular job|beliebter job|passende stelle|empfohlene stelle|jobs? for you|jobs? matching|looking for candidates|join over \d+|opportunity for you|free ebook.*|payment (failure|failed).*|updated?\s+.{0,20}privacy (notice|policy)|.*capital news|content roundup.*|.*ends? in \d+ days.*|#\w.*|hallo,?|hi,?|hey,?|schau dir.*|neuesten treffer.*)$/i;
const INVALID_POSITION_PATTERNS = [
  /\bupdate on your job search\b/i,
  /\byour job search (in|for|update)\b/i,
  /\b(status|update) (of|on) your (job search|application|cv|resume)\b/i,
  /\b(checking in|follow.?up) (on|about) your (job search|application|cv)\b/i,
  /\bhow is your job search\b/i,
  /\bany (news|update) (on|about) your (job search|application)\b/i,
  /\bwe('ve| have) (an )?update (for you|about your job search)\b/i,
  /\bkeeping you (updated|informed) (on|about) your job search\b/i,
  /^(hallo|hi|hey|liebe[r]?|guten)\b/i,
  /^schau dir\b/i,
  /neuest?en treffer/i,
  /gespeicherten stellensuche/i,
  /noch an dem job interessiert/i,
];

const INVALID_COMPANY_OR_POSITION_MARKETING = [
  /nicht viele bewerber/i,
  /warum nicht einer der ersten/i,
  /heute bewerben/i,
  /gute option sein k[oö]nnte/i,
  /nicht warten/i,
  /^[\-–—_=·•\s.]{3,}$/,
  /^hier ist ein job\b/i,
];

/** Reject platform names, agency updates, and other non-job titles before creating a Job record. */
export function validateExtractedJobFields(
  company: string,
  position: string
): { valid: true } | { valid: false; reason: string } {
  const c = company.trim();
  const p = position.trim();

  if (!c || c === "Unknown Company") return { valid: false, reason: "Missing company" };
  if (!p || p === "Unknown Position") return { valid: false, reason: "Missing position" };

  if (FAKE_COMPANY_EXACT.test(c) || FAKE_COMPANY_BY_PREFIX.test(c)) {
    return { valid: false, reason: `Company "${c}" is not a hiring company` };
  }
  for (const pattern of INVALID_COMPANY_PATTERNS) {
    if (pattern.test(c)) {
      return { valid: false, reason: `Company "${c}" looks like an agency/service, not an employer` };
    }
  }

  if (FAKE_POSITION_EXACT.test(p)) {
    return { valid: false, reason: `Position "${p}" is not a real job title` };
  }
  for (const pattern of INVALID_POSITION_PATTERNS) {
    if (pattern.test(p)) {
      return { valid: false, reason: `Position "${p}" looks like a job-search update, not a job posting` };
    }
  }

  for (const pattern of INVALID_COMPANY_OR_POSITION_MARKETING) {
    if (pattern.test(c)) {
      return { valid: false, reason: `Company "${c}" looks like email marketing text` };
    }
    if (pattern.test(p)) {
      return { valid: false, reason: `Position "${p}" looks like email marketing text` };
    }
  }

  // Greeting / teaser lines as company (production Stepstone bug)
  if (/^(hallo|hi|hey|schau dir|beliebter job|passende stelle)\b/i.test(c)) {
    return { valid: false, reason: `Company "${c}" looks like email preamble` };
  }
  if ((c.includes("?") || c.includes("!")) && c.length > 45) {
    return { valid: false, reason: `Company "${c}" looks like marketing copy` };
  }
  if ((p.includes("?") || p.includes("!")) && p.length > 45) {
    return { valid: false, reason: `Position "${p}" looks like marketing copy` };
  }

  return { valid: true };
}

function isInvalidJobPosition(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return validateExtractedJobFields("Acme Corp", trimmed).valid === false;
}

function isInvalidJobCompany(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return validateExtractedJobFields(trimmed, "Software Engineer").valid === false;
}

// ─── Dedicated job board classifier ──────────────────────────────────────────

function classifyJobBoardEmail(payload: JobIntakeEmailPayload): EmailClassificationResult {
  const subject = payload.subject;
  const body = payload.bodyText;
  const from = payload.from.toLowerCase();

  // Hard-reject: unsubscribe-only / newsletter marketing from job boards
  if (/unsubscribe from this newsletter|du erhältst diese e-mail, weil du dich.*newsletter/i.test(body) &&
      !JOB_BODY_SIGNALS.some((p) => p.test(body))) {
    return { isJob: false, confidence: 0.90, reason: "Job board newsletter without job signals", detectedType: "newsletter" };
  }

  // Hard-reject shared subject patterns even from job boards (GDPR, marketing, etc.)
  for (const [pattern, type] of HARD_REJECT_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      return { isJob: false, confidence: 0.92, reason: `Non-job subject from job board: ${pattern.source}`, detectedType: type };
    }
  }

  // Hard-reject body signals
  for (const [pattern, type] of HARD_REJECT_BODY_PATTERNS) {
    if (pattern.test(body)) {
      return { isJob: false, confidence: 0.88, reason: `Non-job body signal from job board: ${pattern.source}`, detectedType: type };
    }
  }

  // ── German-first signals ─────────────────────────────────────────────────────

  // m/w/d gender suffix in subject — near-certain German job posting
  if (/\b(m\/w\/d|w\/m\/d|m\/f\/d|f\/m\/d)\b/i.test(subject)) {
    return { isJob: true, confidence: 0.98, reason: "German job posting with gender-neutral suffix (m/w/d) in subject", detectedType: "job_alert" };
  }

  // m/w/d in body (Stepstone often puts it in body not subject)
  if (/\b(m\/w\/d|w\/m\/d|m\/f\/d)\b/i.test(body)) {
    return { isJob: true, confidence: 0.96, reason: "German job posting with gender-neutral suffix (m/w/d) in body", detectedType: "job_alert" };
  }

  // Stepstone / Xing specific alert patterns
  if (/stepstone/i.test(from)) {
    if (/jobalert|job-alert|neue jobs|passende stellen|ihr job-alarm/i.test(subject) ||
        /beliebter job|passende stelle|empfohlene stelle|jetzt bewerben/i.test(body)) {
      return { isJob: true, confidence: 0.97, reason: "Stepstone job alert email", detectedType: "job_alert" };
    }
  }

  if (/xing/i.test(from)) {
    if (/jobalert|job-alert|ihre job-empfehlung|passende jobs|neue stellen/i.test(subject) ||
        /jetzt bewerben|ich bin interessiert|auf xing bewerben/i.test(body)) {
      return { isJob: true, confidence: 0.97, reason: "Xing job alert email", detectedType: "job_alert" };
    }
  }

  // Generic German job alert subject
  if (/\b(jobalert|job-alert|job-alarm|stellenangebot|neue stelle|passende jobs|vakanz|ihre empfehlung)\b/i.test(subject)) {
    return { isJob: true, confidence: 0.95, reason: "German job board alert subject", detectedType: "job_alert" };
  }

  // German apply CTA in body
  if (/\b(ich bin interessiert|jetzt bewerben|bewerbung einreichen|zur stellenanzeige)\b/i.test(body)) {
    return { isJob: true, confidence: 0.96, reason: "German job board with apply CTA", detectedType: "job_alert" };
  }

  // Recommended/popular job signals (Stepstone, Xing, karriere.at style)
  if (/beliebter job|passende stelle|empfohlene stelle|für dich empfohlen|top-job/i.test(body)) {
    return { isJob: true, confidence: 0.95, reason: "Job board recommended job signal", detectedType: "job_alert" };
  }

  // Salary range with EUR/€
  if (/\d[\d.,]+\s*[-–]\s*\d[\d.,]+\s*(€|EUR)/i.test(body) || /\d{2,3}\.?\d{3}\s*(€|EUR)\s*\/(Jahr|Monat|Jahr)/i.test(body)) {
    return { isJob: true, confidence: 0.93, reason: "Job board email with EUR salary range", detectedType: "job_alert" };
  }

  // ── English / global signals ─────────────────────────────────────────────────

  // Indeed / Glassdoor / Monster job alert subject
  if (/\b(job alert|your alert|new jobs for you|jobs matching)\b/i.test(subject)) {
    return { isJob: true, confidence: 0.94, reason: "Job board alert subject (English)", detectedType: "job_alert" };
  }

  // Generic positive signals
  const bodySignals = JOB_BODY_SIGNALS.filter((p) => p.test(body)).length;
  const subjectSignals = JOB_SUBJECT_SIGNALS.filter((p) => p.test(subject)).length;
  if (bodySignals >= 1 || subjectSignals >= 1) {
    return { isJob: true, confidence: 0.88, reason: `Job board with ${bodySignals} body + ${subjectSignals} subject signals`, detectedType: "job_alert" };
  }

  // Trusted job board domain — accept with moderate confidence
  return { isJob: true, confidence: 0.80, reason: "Email from trusted job board platform", detectedType: "job_alert" };
}

// ─── Main classifier ──────────────────────────────────────────────────────────

export function isRealJobOpportunity(payload: JobIntakeEmailPayload): EmailClassificationResult {
  const from = payload.from.toLowerCase();
  const subject = payload.subject;
  const body = payload.bodyText;

  // Job boards first — some legitimate boards were on the marketing blocklist
  if (JOB_BOARD_SOURCE_MAP.some(([pattern]) => pattern.test(from))) {
    if (from.includes("linkedin.com")) return classifyLinkedInEmail(payload);
    return classifyJobBoardEmail(payload);
  }

  // Reject known marketing / SaaS / ad-network senders immediately
  if (MARKETING_SENDER_PATTERNS.some((p) => p.test(from))) {
    return { isJob: false, confidence: 0.98, reason: "Known marketing/SaaS sender — not a job portal", detectedType: "newsletter" };
  }

  // ATS platform sender — high-confidence real job
  if (ATS_SENDER_PATTERNS.some((p) => p.test(from))) {
    return { isJob: true, confidence: 0.95, reason: "Email from ATS/recruiter platform", detectedType: "job_alert" };
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
  if (subjectMatches.length >= 2) { score += 0.45; reasons.push("strong job subject signals"); }
  else if (subjectMatches.length === 1) { score += 0.28; reasons.push("job subject signal"); }

  const bodyMatches = JOB_BODY_SIGNALS.filter((p) => p.test(body));
  if (bodyMatches.length >= 3) { score += 0.50; reasons.push("multiple job body signals"); }
  else if (bodyMatches.length === 2) { score += 0.35; reasons.push("two job body signals"); }
  else if (bodyMatches.length === 1) { score += 0.20; reasons.push("job body signal"); }

  const hasSalary = /(\$|USD|EUR|CAD|GBP)\s?[\d,.kK]+/i.test(body);
  if (hasSalary) { score += 0.12; reasons.push("salary mention"); }

  // ATS job URL in body even from non-ATS sender
  const hasAtsUrl = /https?:\/\/[^\s]*(greenhouse\.io|lever\.co|ashbyhq\.com|workday\.com|jobvite|icims|taleo|smartrecruiters|bamboohr|recruitee|breezy)[^\s]*/i.test(body);
  if (hasAtsUrl) { score += 0.30; reasons.push("ATS URL in body"); }

  const isJob = score >= 0.90;
  const confidence = Math.min(0.97, score);
  let detectedType: DetectedEmailType = "unknown";
  if (isJob) {
    const isDirectRecruiter = bodyMatches.some((_, i) => i >= 7); // recruiter outreach patterns start at index 7
    detectedType = isDirectRecruiter ? "recruiter_opportunity" : score >= 0.9 ? "job_alert" : "recruiter_opportunity";
  }

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
 * Only runs when LinkedIn's "View job" CTA is present — otherwise Stepstone/Indeed
 * digests would be mis-parsed as LinkedIn cards (e.g. "Hallo," as the title).
 */
function parseLinkedInJobCard(body: string): { position: string; company: string; location?: string } | null {
  if (!/\bview job\b/i.test(body)) return null;

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
  const SKIP_PATTERNS = [
    /^your job alert/i,
    /^job alert/i,
    /^linkedin/i,
    /^hi\s/i,
    /^hallo\b/i,
    /^\d+\s+new\s+job/i,
    /^here are/i,
    /^based on/i,
    /^new jobs/i,
    /^jobs for/i,
    /^matching jobs/i,
  ];
  const contentLines = lines.filter((l) => !SKIP_PATTERNS.some((p) => p.test(l)) && !isJobCardJunkLine(l));

  if (contentLines.length < 2) return null;

  let titleIdx = contentLines.findIndex((l) => JOB_TITLE_SIGNAL.test(l));
  if (titleIdx < 0) titleIdx = 0;
  if (titleIdx >= contentLines.length - 1) return null;

  const position = contentLines[titleIdx];
  const company = contentLines[titleIdx + 1];
  const location =
    contentLines[titleIdx + 2] && !/^(apply|easy apply|see all|unsubscribe)/i.test(contentLines[titleIdx + 2])
      ? contentLines[titleIdx + 2]
      : undefined;

  // Sanity check: position should look like a job title, not an article headline
  const looksLikeArticle =
    /\b(why|how|what|are|is|the|an|a)\b.{20,}/i.test(position) &&
    !/\b(manager|engineer|developer|analyst|director|specialist|coordinator|designer|architect|consultant|lead|head of|vp|vice president|recruiter)\b/i.test(
      position
    );
  if (looksLikeArticle) return null;
  if (validateExtractedJobFields(company, position).valid === false) return null;

  return { position, company, location };
}

const JOB_CARD_SPLIT_PATTERNS = [
  /\bview job\b/i,
  /\bjetzt bewerben\b/i,
  /\bzur stellenanzeige\b/i,
  /\bapply now\b/i,
  /\beasily apply\b/i,
  /\bsee job\b/i,
  /\bopen position\b/i,
  /\bbewerben\b/i,
];

const JOB_CARD_HEADER_SKIP = [
  /^your job alert/i,
  /^job alert/i,
  /^neue jobs/i,
  /^passende stellen/i,
  /^beliebter job/i,
  /^top.job/i,
  /^empfohlene stelle/i,
  /^here are/i,
  /^new jobs/i,
  /^jobs matching/i,
  /^unsubscribe/i,
  /^ihr job-alarm/i,
  /^stepstone/i,
  /^xing/i,
  /^indeed/i,
  /^glassdoor/i,
  /^monster/i,
  // Stepstone / DE digest greetings and marketing teasers (must not become title/company)
  /^(hallo|hi|hey|liebe[r]?|guten (tag|morgen|abend))\b/i,
  /^schau dir\b/i,
  /neuest?en treffer/i,
  /^hier ist ein job\b/i,
  /nicht viele bewerber/i,
  /warum nicht einer der ersten/i,
  /heute bewerben/i,
  /gute option sein k[oö]nnte/i,
  /nicht warten/i,
  /^jetzt bewerben\b/i,
  /^easily apply\b/i,
  /^apply now\b/i,
  /^view job\b/i,
  /^siehe stelle\b/i,
  /^guten tag\b/i,
  /gespeicherten stellensuche/i,
  /noch an dem job interessiert/i,
  /^[\-–—_=·•\s.]{1,}$/,
];

const JOB_TITLE_SIGNAL =
  /\((?:m\/w\/d|w\/m\/d|m\/f\/d|f\/m\/d|all genders|divers)\)|\b(engineer|developer|manager|analyst|consultant|specialist|assistant|director|lead|architect|designer|accountant|nurse|teacher|sales|marketing|hr\b|recrui|kaufmann|kauffrau|sachbearbeiter|entwickler|ingenieur)\b/i;

function isJobCardJunkLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 140) return true;
  if (JOB_CARD_HEADER_SKIP.some((p) => p.test(t))) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^(€|\$|gehalt|salary|remote|hybrid)\b/i.test(t)) return true;
  // Long marketing sentences with punctuation are not titles/companies
  if ((t.includes("?") || t.includes("!")) && t.length > 40) return true;
  if (/,.*,/.test(t) && t.length > 60) return true;
  return false;
}

/** Parse the first job card from Stepstone, Indeed, Xing, and similar digest alerts. */
function parseJobBoardJobCard(body: string): { position: string; company: string; location?: string } | null {
  const linkedInCard = parseLinkedInJobCard(body);
  if (linkedInCard) return linkedInCard;

  let firstBlock = body;
  for (const pattern of JOB_CARD_SPLIT_PATTERNS) {
    const parts = body.split(pattern);
    if (parts.length > 1) {
      // Prefer the block AFTER the first CTA when preamble is before "Jetzt bewerben"
      // For Stepstone, structure is often: preamble + title + company + CTA + next title...
      // Using parts[0] kept the preamble; scan whole body for a title-like line instead.
      firstBlock = body;
      break;
    }
  }

  const lines = firstBlock
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 140);

  const contentLines = lines.filter((l) => !isJobCardJunkLine(l));
  if (contentLines.length < 2) return null;

  // Prefer a real DE/EN job title signal (e.g. "Software Engineer (m/w/d)")
  let titleIdx = contentLines.findIndex((l) => JOB_TITLE_SIGNAL.test(l));
  if (titleIdx < 0) {
    // Fallback: first short line that does not look like a sentence
    titleIdx = contentLines.findIndex((l) => l.length <= 80 && !/[.!?].+\s/.test(l));
  }
  if (titleIdx < 0 || titleIdx >= contentLines.length - 1) return null;

  const position = contentLines[titleIdx];
  const company = contentLines[titleIdx + 1];
  let location: string | undefined = contentLines[titleIdx + 2];

  const dashMatch = company.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch && dashMatch[1].length < 60 && dashMatch[2].length < 80) {
    return {
      position,
      company: dashMatch[1].trim(),
      location: dashMatch[2].trim(),
    };
  }

  if (location && /^(€|\$|apply|bewerb|http|salary|gehalt|jetzt)/i.test(location)) {
    location = undefined;
  }
  if (location && isJobCardJunkLine(location)) {
    location = undefined;
  }

  if (!position || !company) return null;
  if (/^(stepstone|xing|indeed|glassdoor|monster|linkedin)$/i.test(company)) return null;
  if (isJobCardJunkLine(position) || isJobCardJunkLine(company)) return null;

  return { position, company, location };
}

function extractCompany(payload: JobIntakeEmailPayload): string {
  const card = parseJobBoardJobCard(payload.bodyText);
  if (card?.company && !isInvalidJobCompany(card.company)) return card.company;

  const subjectMatch = payload.subject.match(/\bat\s+([A-Za-z0-9][A-Za-z0-9\s.&'-]{1,40})\s*$/i);
  if (subjectMatch?.[1] && !isInvalidJobCompany(subjectMatch[1])) return subjectMatch[1].trim();

  // Do not fall back to platform name as company
  const domain = payload.from.split("@")[1]?.split(".")[0];
  if (
    !domain ||
    domain === "linkedin" ||
    domain === "indeed" ||
    domain === "stepstone" ||
    domain === "xing" ||
    domain === "noreply" ||
    domain === "employment" ||
    domain === "recruitment" ||
    domain === "staffing"
  ) {
    return "Unknown Company";
  }
  const fromDomain = domain.replace(/[-_]/g, " ");
  return isInvalidJobCompany(fromDomain) ? "Unknown Company" : fromDomain;
}

function extractPosition(payload: JobIntakeEmailPayload): string {
  const card = parseJobBoardJobCard(payload.bodyText);
  if (card?.position && !isInvalidJobPosition(card.position)) return card.position;

  const subject = payload.subject.trim();
  // Strip "job alert for X" → X is the search query, not a job title; don't use as position
  if (/^your job alert for\s+/i.test(subject)) return "Unknown Position";
  if (isInvalidJobPosition(subject)) return "Unknown Position";

  const atIndex = subject.toLowerCase().indexOf(" at ");
  if (atIndex > 0) {
    const candidate = subject.slice(0, atIndex).trim();
    if (!isInvalidJobPosition(candidate)) return candidate;
  }
  if (subject && !isInvalidJobPosition(subject) && subject.length <= 80) return subject;
  return "Unknown Position";
}

/** Legacy export — deterministic extraction (no external API). */
export async function extractJobFromEmail(payload: JobIntakeEmailPayload): Promise<JobExtractionResult> {
  const jobBoardCard = parseJobBoardJobCard(payload.bodyText);

  // Prefer /jobs/view/ URL for LinkedIn, otherwise first URL in body
  const jobsViewMatch = payload.bodyText.match(/https?:\/\/[^\s)]*linkedin\.com\/jobs\/view\/[^\s)]*/i);
  const urlMatch = jobsViewMatch ?? payload.bodyText.match(/https?:\/\/[^\s)]+/i);

  const salaryMatch = payload.bodyText.match(/(?:\$|USD|CAD|EUR|€)\s?[\d,.kK]+(?:\s?-\s?(?:\$|USD|CAD|EUR|€)?\s?[\d,.kK]+)?/i);

  // Deadline extraction: "apply by", "closes on", "deadline: <date>"
  const deadlineMatch = payload.bodyText.match(/(?:apply by|deadline[:\s]+|closes?\s+on[:\s]+|applications?\s+close[:\s]+)(\w+ \d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  const deadline = deadlineMatch ? (() => { try { const d = new Date(deadlineMatch[1]); return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10); } catch { return undefined; } })() : undefined;

  const locationFromCard = jobBoardCard?.location;
  const locationKw = locationFromCard ?? LOCATION_KEYWORDS.find((keyword) =>
    payload.bodyText.toLowerCase().includes(keyword)
  );

  const company = extractCompany(payload);
  const position = extractPosition(payload);

  const signals = [Boolean(urlMatch), Boolean(salaryMatch), Boolean(locationKw), Boolean(payload.subject), Boolean(jobBoardCard)].filter(Boolean).length;
  const confidence = Math.min(0.9, 0.6 + signals * 0.06);

  return {
    company,
    position,
    location: locationKw ? (locationKw.charAt(0).toUpperCase() + locationKw.slice(1)) : undefined,
    jobUrl: urlMatch?.[0],
    salaryRange: salaryMatch?.[0],
    deadline,
    source: resolveJobSourceFromEmail(payload.from),
    confidence,
    description: payload.bodyText.slice(0, 1000),
    raw: {
      from: payload.from,
      subject: payload.subject,
    },
  };
}

function shouldUseStub(config: AiRuntimeConfig): boolean {
  if (config.provider === "Stub") return true;
  // Use Claude whenever a key is available from env or config — never block on fallbackToStub alone.
  const hasKey = Boolean(resolveAnthropicApiKey() ?? config.apiKeyDecrypted);
  return !hasKey;
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
- is_job_opportunity: true ONLY for a real job posting with a clear job title and hiring company. Set false for: newsletters, marketing/promotional emails, account notifications, GDPR/consent emails, SaaS tool emails.
- For job board digest emails (Stepstone, Indeed, Xing, LinkedIn, etc.) with MULTIPLE listings, extract the FIRST job only and set is_job_opportunity to true if that first job has a clear title and company.
- company: the ACTUAL HIRING COMPANY name (the organisation that will employ the person). NEVER use: "linkedin", "stepstone", "xing", "indeed", "job agent", "jobbörse", "job board", the email sender name, or the name of a recruitment platform.
- position: the EXACT JOB TITLE as stated in the posting (e.g. "Senior Software Engineer", "Marketing Manager (m/w/d)"). NEVER use: email subject lines verbatim, generic phrases like "New job opportunity for you", "Our recommendation", "Popular job", "Jobs matching your profile", or any marketing copy. If you cannot identify a clear job title, set is_job_opportunity to false.
- If the email contains MULTIPLE job listings (a digest), extract the FIRST job only — do not reject solely because there are multiple jobs.
- source_type: one of "linkedin_job_alert" | "saved_job_reminder" | "ats_job_alert" | "direct_recruiter" | "stepstone_job_alert" | "xing_job_alert" | "indeed_job_alert" | "glassdoor_job_alert" | "monster_job_alert" | "job_board_alert" | "unknown"
- Set is_job_opportunity to false for agency job-search status updates (e.g. "Update on your job search", "checking in on your application") — these are not job postings.
- NEVER use generic agency names like "employment agency" or "recruitment agency" as the company.
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
            const resolvedSource = resolveJobSourceFromEmail(input.payload.from, parsed.source_type);
            const hasValidBase =
              base.company &&
              base.company !== "Unknown Company" &&
              base.position &&
              base.position !== "Unknown Position" &&
              validateExtractedJobFields(base.company, base.position).valid;

            // If Claude says it's not a job, fall back to deterministic parsing for trusted job boards
            if (!parsed.is_job_opportunity) {
              if (isJobBoardSender(input.payload.from) && hasValidBase) {
                return {
                  provider: "Claude",
                  model: result.model,
                  usedStub: false,
                  confidence: base.confidence,
                  data: {
                    ...base,
                    source: resolvedSource,
                  },
                  usage: usageFromLengths(body.length, result.text.length),
                };
              }
              return {
                provider: "Claude",
                model: result.model,
                usedStub: false,
                confidence: 0,
                data: { ...base, company: "", position: "" },
                usage: usageFromLengths(body.length, result.text.length),
              };
            }
            const company = /^(linkedin|stepstone|xing|indeed|glassdoor|monster)$/i.test(parsed.company?.trim() || "")
              ? base.company
              : (parsed.company?.trim() || base.company);
            const position = parsed.position?.trim() || base.position;
            const fieldValidation = validateExtractedJobFields(company, position);
            if (!fieldValidation.valid) {
              return {
                provider: "Claude",
                model: result.model,
                usedStub: false,
                confidence: 0,
                data: { ...base, company: "", position: "" },
                usage: usageFromLengths(body.length, result.text.length),
              };
            }
            const confidence = typeof parsed.confidence === "number" ? parsed.confidence : base.confidence;
            return {
              provider: "Claude",
              model: result.model,
              usedStub: false,
              confidence,
              data: {
                company,
                position,
                location: parsed.location ?? base.location,
                jobUrl: parsed.job_url ?? base.jobUrl,
                salaryRange: parsed.salary ?? base.salaryRange,
                source: resolvedSource,
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

  const stubData = { ...base, source: resolveJobSourceFromEmail(input.payload.from) };
  const stubValidation = validateExtractedJobFields(stubData.company, stubData.position);
  if (!stubValidation.valid) {
    return {
      provider,
      model: usedStub ? DEFAULT_AI_MODEL : (input.config.model ?? DEFAULT_AI_MODEL),
      usedStub,
      confidence: 0,
      data: { ...stubData, company: "", position: "" },
      usage: usageFromLengths(body.length, JSON.stringify(base).length),
    };
  }

  return {
    provider,
    model: usedStub ? DEFAULT_AI_MODEL : (input.config.model ?? DEFAULT_AI_MODEL),
    usedStub,
    confidence: base.confidence,
    data: stubData,
    usage: usageFromLengths(body.length, JSON.stringify(base).length),
  };
}

/** @deprecated Use resolveJobSourceFromEmail */
function payload_source(payload: JobIntakeEmailPayload): string {
  return resolveJobSourceFromEmail(payload.from);
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

export interface TailoredCvResult {
  tailoredHeadline: string;
  tailoredSummary: string;
  atsKeywords: string[];
  missingKeywords: string[];
  atsScoreBefore: number;
  atsScoreAfter: number;
  tailoredBullets: Array<{ role: string; bullets: string[] }>;
  promptVersion: string;
}

export async function runTailoredCvGeneration(input: {
  cvText: string;
  job: { company: string; position: string; description?: string };
  config: AiRuntimeConfig;
  userInstructions?: string;
}): Promise<AiServiceResult<TailoredCvResult>> {
  const apiKey = resolveAnthropicApiKey() ?? input.config.apiKeyDecrypted;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const modelCandidates = buildAnthropicModelCandidates(input.config.model);
  const inText = `${input.job.company} ${input.job.position} ${input.job.description ?? ""}`;

  const prompt = [
    "You are an expert ATS resume optimizer and career coach. Your task is to tailor an existing CV to a specific job posting.",
    "CRITICAL RULES:",
    "- Never invent experience, credentials, or skills not present in the original CV.",
    "- Never change dates, company names, job titles, or metrics from the original CV.",
    "- Only rewrite headline, summary, and reorder/reframe existing bullet points to match job keywords.",
    "- Output ONLY valid JSON — no markdown, no commentary.",
    "",
    "Return a JSON object with exactly these keys:",
    '  "tailoredHeadline": string — rewritten professional headline targeting this specific role (max 12 words)',
    '  "tailoredSummary": string — rewritten 3-4 sentence summary with ATS keywords naturally embedded',
    '  "atsKeywords": array of strings — top 10-15 keywords from the job description found in the CV',
    '  "missingKeywords": array of strings — important keywords from JD NOT found in CV (max 8)',
    '  "atsScoreBefore": number — estimated ATS match score 0-100 for original CV',
    '  "atsScoreAfter": number — estimated ATS match score 0-100 for tailored CV',
    '  "tailoredBullets": array of { "role": string, "bullets": string[] } — top 2-3 roles from CV with reordered/reframed bullets (most relevant to this job first)',
    "",
    `Target Company: ${input.job.company}`,
    `Target Position: ${input.job.position}`,
    `Job Description:\n${input.job.description ?? "Not provided"}`,
    "",
    `Original CV:\n${input.cvText}`,
    ...(input.userInstructions ? ["", `Additional instructions:\n${input.userInstructions}`] : []),
  ].join("\n");

  const result = await callAnthropicMessages({ prompt, apiKey, modelCandidates, maxTokens: 2000, temperature: 0.3 });
  if (!result.ok) throw new Error(`Claude CV tailoring failed: [${result.errorType}] ${result.message}`);

  const cleaned = result.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned non-JSON CV tailoring output");
    parsed = JSON.parse(match[0]) as Record<string, unknown>;
  }

  const data: TailoredCvResult = {
    tailoredHeadline: String(parsed.tailoredHeadline ?? ""),
    tailoredSummary: String(parsed.tailoredSummary ?? ""),
    atsKeywords: Array.isArray(parsed.atsKeywords) ? (parsed.atsKeywords as string[]) : [],
    missingKeywords: Array.isArray(parsed.missingKeywords) ? (parsed.missingKeywords as string[]) : [],
    atsScoreBefore: Number(parsed.atsScoreBefore ?? 0),
    atsScoreAfter: Number(parsed.atsScoreAfter ?? 0),
    tailoredBullets: Array.isArray(parsed.tailoredBullets)
      ? (parsed.tailoredBullets as Array<{ role: string; bullets: string[] }>)
      : [],
    promptVersion: "tailored-cv-v1-claude-json",
  };

  return {
    provider: "Claude",
    model: result.model,
    usedStub: false,
    confidence: 0.88,
    data,
    usage: usageFromLengths(inText.length + input.cvText.length, result.text.length),
  };
}

export async function runCoverLetterGeneration(input: {
  job: { company: string; position: string; description?: string; tone?: "professional" | "confident" | "friendly" };
  config: AiRuntimeConfig;
  userInstructions?: string;
  cvText?: string;
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
    input.cvText
      ? "Base the letter on the candidate's actual CV experience provided below. Do not fabricate credentials."
      : "Do not fabricate credentials. Only cite experience from the job description.",
    "",
    `Company: ${input.job.company}`,
    `Position: ${input.job.position}`,
    `Job description:\n${input.job.description ?? "Not provided"}`,
    ...(input.cvText ? ["", `Candidate CV:\n${input.cvText}`] : []),
    ...(input.userInstructions ? ["", `Additional instructions from the user:\n${input.userInstructions}`] : []),
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
