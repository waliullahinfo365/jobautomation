# Automation Module Specs

## job-intake
- **moduleKey:** `job-intake`
- **displayName:** Job Intake Engine
- **purpose:** Ingest job-alert emails and create normalized job records.
- **trigger:** Gmail webhook/poll event
- **input:** email subject/body/sender/date
- **output:** job record create/update
- **database reads:** `Job`, `IntegrationConnection`
- **database writes:** `Job`, `AutomationLog`
- **external integrations:** Gmail, AI
- **success log:** `Job intake processed successfully`
- **failure log:** `Job intake failed`
- **retry policy:** exponential backoff, max 5
- **idempotency rule:** one job per tenant + normalized company+position+jobUrl fingerprint

## duplicate-protection
- **moduleKey:** `duplicate-protection`
- **purpose:** Detect duplicates and mark record status.
- **trigger:** post-intake event
- **input/output:** candidate job -> duplicate classification
- **reads/writes:** `Job`, `AutomationLog`
- **integrations:** none required
- **success/failure logs:** `Duplicate check completed` / `Duplicate check failed`
- **retry:** up to 3
- **idempotency:** never delete duplicates automatically; mark `Possible Duplicate`/`Duplicate`

## folder-automation
- **moduleKey:** `folder-automation`
- **purpose:** Provision Drive folder structure per job.
- **trigger:** job creation or status transition
- **reads/writes:** `Job`, `Document`, `AutomationLog`
- **integrations:** Google Drive
- **retry:** 5 attempts, transient-only retries
- **idempotency:** one folder tree per tenant+job

## applied-status
- **moduleKey:** `applied-status`
- **purpose:** Handle applied transition side effects.
- **trigger:** application state update
- **reads/writes:** `Application`, `Interview`, `AutomationLog`
- **integrations:** Gmail, Google Calendar
- **retry:** step-level retries (send/update/calendar)
- **idempotency:** one applied action set per application transition occurrence

## interview-scheduling
- **moduleKey:** `interview-scheduling`
- **purpose:** Create/sync interview calendar events.
- **trigger:** interview lifecycle event
- **reads/writes:** `Interview`, `AutomationLog`
- **integrations:** Google Calendar
- **retry:** 4 attempts
- **idempotency:** no duplicate calendar event for same interview slot

## cv-routing
- **moduleKey:** `cv-routing`
- **purpose:** Route CV artifacts to target folder.
- **trigger:** document routing request
- **reads/writes:** `Document`, `Job`, `AutomationLog`
- **integrations:** Google Drive
- **retry:** 3 attempts
- **idempotency:** dedupe by source file id + job id + target path

## email-reply-detection
- **moduleKey:** `email-reply-detection`
- **purpose:** Detect inbound replies and update response state.
- **trigger:** inbound email webhook
- **reads/writes:** `Application`, `IntegrationConnection`, `AutomationLog`
- **integrations:** Gmail
- **retry:** 5 attempts
- **idempotency:** process each provider message ID once

## follow-up-reminder
- **moduleKey:** `follow-up-reminder`
- **purpose:** Send due follow-up reminders.
- **trigger:** scheduled daily sweep
- **reads/writes:** `Application`, `AutomationLog`
- **integrations:** SMTP/Telegram (channel-specific later)
- **retry:** 3 attempts per reminder
- **idempotency:** no duplicate reminder for same application + follow-up date

## pdf-export
- **moduleKey:** `pdf-export`
- **purpose:** Convert documents/reports to PDF.
- **trigger:** conversion request/file event
- **reads/writes:** `Document`, `Report`, `AutomationLog`
- **integrations:** Drive + conversion provider
- **retry:** 4 attempts
- **idempotency:** one PDF artifact version per source document version

## research-document
- **moduleKey:** `research-document`
- **purpose:** Generate research-stage docs from templates.
- **trigger:** job status `Research`
- **reads/writes:** `Job`, `Document`, `AutomationLog`
- **integrations:** Google Drive/Docs
- **retry:** 3 attempts
- **idempotency:** one generated template copy per tenant+job+templateVersion

## ai-processing
- **moduleKey:** `ai-processing`
- **purpose:** AI extraction and draft enrichment.
- **trigger:** processing request queue
- **reads/writes:** `Job`, `Document`, `AutomationLog`
- **integrations:** AI providers
- **retry:** class-based retry (transient vs validation failure)
- **idempotency:** one processing run lock per tenant+job+runType

## network-follow-up
- **moduleKey:** `network-follow-up`
- **purpose:** Manage networking contact reminders.
- **trigger:** scheduled scan
- **reads/writes:** `Contact`, `AutomationLog`
- **integrations:** notification channel(s)
- **retry:** 3 attempts
- **idempotency:** one send per contact + due-date window

## offer-tracking
- **moduleKey:** `offer-tracking`
- **purpose:** Track and notify offer transitions.
- **trigger:** application status `Offer`
- **reads/writes:** `Application`, `Report`, `AutomationLog`
- **integrations:** Sheets/Email/Slack (later)
- **retry:** 3 attempts
- **idempotency:** one offer-log write per tenant+application+offerVersion

## deadline-alert
- **moduleKey:** `deadline-alert`
- **purpose:** Alert on approaching deadlines.
- **trigger:** scheduler (hourly/daily)
- **reads/writes:** `Job`, `AutomationLog`
- **integrations:** notification channels
- **retry:** 3 attempts
- **idempotency:** one alert per tenant+job+deadline+tier

## lifecycle-monitoring
- **moduleKey:** `lifecycle-monitoring`
- **purpose:** Identify stale records and apply lifecycle policy.
- **trigger:** daily scheduler
- **reads/writes:** `Job`, `AuditLog`, `AutomationLog`
- **integrations:** none required
- **retry:** batch retry with resume cursor
- **idempotency:** one transition per tenant+job+policyEpoch

## daily-digest
- **moduleKey:** `daily-digest`
- **purpose:** Generate/send daily summary per tenant.
- **trigger:** daily scheduler
- **reads/writes:** `Report`, `AutomationLog`
- **integrations:** email/telegram/slack
- **retry:** 3 attempts
- **idempotency:** send once per tenant per day

## weekly-report
- **moduleKey:** `weekly-report`
- **purpose:** Generate/send weekly performance report.
- **trigger:** weekly scheduler
- **reads/writes:** `Report`, `AutomationLog`
- **integrations:** email/sheets/pdf
- **retry:** 3 attempts
- **idempotency:** send once per tenant per week
