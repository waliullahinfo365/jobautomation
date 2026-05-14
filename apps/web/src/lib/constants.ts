// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 100;

// ─── Cache TTLs (seconds) ─────────────────────────────────────────────────────

export const CACHE_TTL = {
  short:  60,
  medium: 300,
  long:   3600,
} as const;

// ─── Worker schedules (cron expressions) ─────────────────────────────────────

export const WORKER_SCHEDULES = {
  dailyDigest:       "0 8 * * *",       // 08:00 every day
  weeklyReport:      "0 9 * * 1",       // 09:00 every Monday
  deadlineAlert:     "0 7 * * *",       // 07:00 every day
  emailReplyCheck:   "*/15 * * * *",    // every 15 minutes
  followUpReminder:  "0 9 * * *",       // 09:00 every day
  lifecycleMonitor:  "0 * * * *",       // every hour
} as const;

// ─── App strings ──────────────────────────────────────────────────────────────

export const APP_NAME        = "NewJob Guru";
export const APP_DESCRIPTION = "AI-powered job application automation";
export const APP_VERSION     = "0.1.0";

// ─── Follow-up timings (days) ────────────────────────────────────────────────

export const FOLLOW_UP_DAYS = {
  afterApplied:     7,
  afterInterview:   3,
  networkCadence:   14,
  offerDecision:    5,
} as const;

// ─── Duplicate detection ─────────────────────────────────────────────────────

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.85; // 85% similarity = duplicate
