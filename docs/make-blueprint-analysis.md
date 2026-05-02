# Make Blueprint Analysis

This document maps each Make.com scenario to an equivalent custom-code design in the monorepo (`apps/api`, `apps/workers`, `packages/database`, `packages/integrations`).

## 01 - Job Intake Engine
- **Current Make trigger:** Gmail watch new emails (`google-email:triggerWatchNewEmails`)
- **Services used:** Gmail, RegExp parser, Anthropic Claude, Notion, Router
- **Main input:** Email subject/body/from/date
- **Main output:** Parsed job fields + Notion create/update
- **Key filters:** Subject keyword gating for sales/product roles; router on Notion match existence
- **Workflow steps:** Watch email -> regex parse -> Claude extraction -> Notion search -> update/create
- **Error handling:** Global scenario retries only (`maxErrors=3`)
- **Storage location:** Notion data source
- **External side effects:** Marks email seen, LLM call, Notion write
- **Make limitations:** Keyword misses, weak idempotency, no dead-letter replay
- **Custom replacement:** Inbound email pipeline + schema-validated extraction + deterministic upsert
- **Suggested worker/service:** `job-intake-worker`
- **Suggested API endpoints:** `POST /jobs/intake-email`, `POST /jobs/extract`, `POST /jobs/upsert`
- **Suggested DB models:** `Job`, `AutomationLog`, `IntegrationConnection`
- **Queue/scheduler:** Event queue per message with retry + poison queue
- **Risks/edge cases:** Forwarded email formats, malformed LLM JSON, duplicates across aliases
- **Testing notes:** Fixture inbox tests, extraction schema tests, idempotent reprocessing tests

## 02 - Duplicate Protection Engine
- **Trigger:** Gmail watch new emails
- **Services:** Gmail, RegExp, Notion
- **Input/Output:** Parsed company/position -> create only if no match
- **Filters:** Notion record existence check
- **Workflow:** Watch -> parse -> search -> conditional create
- **Errors:** Global retries only
- **Storage:** Notion
- **Side effects:** New job records
- **Limitations:** Limited duplicate dimensions, race risk
- **Replacement:** DB unique constraints + fuzzy duplicate scoring + flagging
- **Worker:** `duplicate-protection-worker`
- **API:** `POST /jobs/:id/check-duplicate`
- **Models:** `Job`, `AutomationLog`
- **Queue:** Partition by tenant+fingerprint
- **Risks:** Same role reposts, company aliases
- **Tests:** Concurrent duplicate insert tests, false-positive regression set

## 03 - Folder & Subfolder Automation
- **Trigger:** Notion database item watch
- **Services:** Notion, Google Drive
- **Input/Output:** Job metadata + `Folder Created` false -> Drive folder + Notion update
- **Filters:** Folder not created
- **Workflow:** Watch -> create folder -> update record
- **Errors:** Global retries only
- **Storage:** Notion + Drive
- **Side effects:** Drive folder creation
- **Limitations:** brittle bool checks, no compensation on partial failure
- **Replacement:** Idempotent provisioning workflow with external-id persistence
- **Worker:** `folder-automation-worker`
- **API:** `POST /jobs/:id/folders/provision`
- **Models:** `Job`, `Document`, `AutomationLog`
- **Queue:** Event queue on status transition
- **Risks:** Duplicate folder creation on retry
- **Tests:** Exactly-once folder provisioning and retry tests

## 04 - Applied Status Automation
- **Trigger:** Notion watch updates
- **Services:** Notion, Gmail, Google Calendar
- **Input/Output:** Status `Applied` + contact email -> send email, update applied date, create calendar event
- **Filters:** status and missing date guards
- **Workflow:** Watch -> send -> update -> schedule
- **Errors:** Global retries only
- **Storage:** Notion + Gmail/Calendar side effects
- **Side effects:** Sends external email/calendar
- **Limitations:** Side-effect ordering can desync state
- **Replacement:** Saga-style state machine for send/update/calendar
- **Worker:** `applied-status-worker`
- **API:** `POST /applications/:id/mark-applied`, `POST /applications/:id/schedule-follow-up`
- **Models:** `Application`, `Interview`, `AutomationLog`
- **Queue:** Chained step queue with retry + compensation
- **Risks:** Duplicate sends, timezone issues
- **Tests:** Transition matrix + exactly-once send tests

## 05 - Interview Scheduling Automation
- **Trigger:** Notion watch updates
- **Services:** Notion, Google Calendar
- **Input/Output:** Interview stage statuses -> calendar event + flag
- **Filters:** Stage set; for Final Round ensure prep flag false
- **Workflow:** Watch -> create event -> update flag
- **Errors:** Global retries
- **Storage:** Notion + Calendar
- **Side effects:** Event creation
- **Limitations:** Inconsistent dedupe rules by stage
- **Replacement:** Status->template rule map with event dedupe key
- **Worker:** `interview-scheduling-worker`
- **API:** `POST /interviews/:id/create-calendar-event`
- **Models:** `Interview`, `AutomationLog`
- **Queue:** Event queue keyed by tenant+interview
- **Risks:** Reschedules and duplicate events
- **Tests:** Re-entry idempotency + reschedule tests

## 06 - CV File Routing Automation
- **Trigger:** Notion watch updates
- **Services:** Notion, RegExp, Google Drive
- **Input/Output:** CV doc link -> copied/routed file in Drive + status update
- **Filters:** CV link exists and not moved
- **Workflow:** Watch -> parse id -> download -> search target -> upload -> update
- **Errors:** Global retries
- **Storage:** Drive + Notion
- **Side effects:** File transfer actions
- **Limitations:** Link parsing brittle, duplicate uploads on retries
- **Replacement:** Transfer job with checksum + idempotency token
- **Worker:** `cv-routing-worker`
- **API:** `POST /documents/route-cv`
- **Models:** `Document`, `Job`, `AutomationLog`
- **Queue:** Background transfer queue with dedupe on source+job
- **Risks:** Permission loss, large files
- **Tests:** Invalid link parser tests, retry no-duplicate tests

## 07 - Email Reply Detection
- **Trigger:** Gmail watch new emails
- **Services:** Gmail, RegExp, Notion, Telegram
- **Input/Output:** Reply signals -> response flags in records + Telegram notify
- **Filters:** Search applied rows with response not received
- **Workflow:** Watch -> parse token -> search -> update -> notify
- **Errors:** Global retries
- **Storage:** Notion
- **Side effects:** Notifications and status changes
- **Limitations:** Weak matching without thread/message IDs
- **Replacement:** Thread-mapped reply ingestion + deterministic match update
- **Worker:** `email-reply-detection-worker`
- **API:** `POST /integrations/gmail/reply-webhook`, `POST /applications/:id/mark-response`
- **Models:** `Application`, `IntegrationConnection`, `AutomationLog`
- **Queue:** Webhook ingestion queue with provider message id dedupe
- **Risks:** Auto replies, ambiguous company parsing
- **Tests:** Thread mapping fixtures, duplicate webhook tests

## 08 - Follow-Up Reminder Engine
- **Trigger:** Notion search poll
- **Services:** Notion, Telegram HTTP API
- **Input/Output:** Applied + no response + date threshold -> reminder + flag update
- **Filters:** Date applied <= now-7d; response/reminder flags
- **Workflow:** Search -> threshold filter -> notify -> mark sent
- **Errors:** Global retries
- **Storage:** Notion
- **Side effects:** Telegram sends
- **Limitations:** Hardcoded token URL; no delivery ledger
- **Replacement:** Scheduled reminder worker + notification ledger + secure secret usage
- **Worker:** `follow-up-reminder-worker`
- **API:** `POST /automation/modules/follow-up-reminder/run`
- **Models:** `Application`, `AutomationLog`
- **Queue:** Daily scheduler -> queue due reminders
- **Risks:** Duplicate reminders on failed state update
- **Tests:** date boundary and exactly-once reminder tests

## 09 - Document PDF Export Automation
- **Trigger:** Drive search poll
- **Services:** Google Drive, CloudConvert, Notion, Router
- **Input/Output:** DOC/DOCX files -> PDF artifact + linked record update
- **Filters:** convert only when PDF missing; branch by filename token
- **Workflow:** Search source -> check existing PDF -> convert -> upload -> map record -> update
- **Errors:** Global retries
- **Storage:** Drive + Notion
- **Side effects:** Conversion jobs + file uploads
- **Limitations:** Name-based linking fragile; no artifact checksum/version
- **Replacement:** Document conversion pipeline keyed by `documentId`
- **Worker:** `pdf-export-worker`
- **API:** `POST /documents/:id/export-pdf`
- **Models:** `Document`, `AutomationLog`
- **Queue:** conversion queue + publish queue
- **Risks:** Duplicate conversions, mismatched record links
- **Tests:** CV/CL branch tests + conversion retry tests

## 10 - Research Stage Document Generation
- **Trigger:** Notion watch updates
- **Services:** Notion, Google Drive
- **Input/Output:** Researching status -> copy CV/CL templates -> update links
- **Filters:** status and missing link checks
- **Workflow:** Watch -> copy templates -> update
- **Errors:** Global retries
- **Storage:** Notion + Drive
- **Side effects:** New documents
- **Limitations:** No template-version tracking
- **Replacement:** Template service with generation metadata
- **Worker:** `research-document-worker`
- **API:** `POST /jobs/:id/generate-research`, `POST /jobs/:id/generate-draft`
- **Models:** `Document`, `Job`, `AutomationLog`
- **Queue:** event-driven job transition queue
- **Risks:** partial completion (one doc only)
- **Tests:** two-document atomic behavior tests

## 11 - AI Processing & Data Extraction Engine
- **Trigger:** Notion watch updates
- **Services:** Notion, RegExp, Drive/Docs, Anthropic
- **Input/Output:** CV and research data -> AI extraction + draft docs + state updates
- **Filters:** researching + AI draft missing + CV link checks
- **Workflow:** Watch -> set processing -> parse doc id -> read doc -> Claude -> create output -> update record
- **Errors:** Global retries
- **Storage:** Notion + Drive/Docs
- **Side effects:** LLM calls and generated docs
- **Limitations:** prompt/version provenance missing, weak validation persistence
- **Replacement:** AI run table + validated extraction schema + lock per job
- **Worker:** `ai-processing-worker`
- **API:** `POST /jobs/:id/generate-research`, `POST /jobs/:id/generate-draft`
- **Models:** `Job`, `Document`, `AutomationLog`
- **Queue:** priority queue with distributed lock
- **Risks:** malformed outputs, token limits
- **Tests:** schema validation and prompt regression tests

## 12 - Network Follow-Up Automation
- **Trigger:** Notion search poll
- **Services:** Notion, Telegram
- **Input/Output:** contacts due in <=1 day -> notify + contact update
- **Filters:** due date window
- **Workflow:** search -> notify -> update
- **Errors:** Global retries
- **Storage:** Notion networking DB
- **Side effects:** notifications
- **Limitations:** no cooldown/delivery tracking
- **Replacement:** due-date scheduler with dedupe key per contact+date
- **Worker:** `network-follow-up-worker`
- **API:** `POST /contacts/:id/mark-followed-up`
- **Models:** `Contact`, `AutomationLog`
- **Queue:** daily scheduler + queue
- **Risks:** timezone/due-date drift
- **Tests:** boundary windows and duplicate send tests

## 13 - Offer Tracking Automation
- **Trigger:** Notion watch updates
- **Services:** Notion, Google Sheets, Telegram
- **Input/Output:** Offer status -> append sheet + notify + log flag
- **Filters:** status=Offer and not logged
- **Workflow:** watch -> append sheet -> notify -> update flag
- **Errors:** Global retries
- **Storage:** Notion + Sheets
- **Side effects:** sheet append + notifications
- **Limitations:** no unique offer key, partial completion risk
- **Replacement:** offer ledger service + sync exports + notification queue
- **Worker:** `offer-tracking-worker`
- **API:** `PATCH /applications/:id`, `POST /automation/modules/offer-tracking/run`
- **Models:** `Application`, `Report`, `AutomationLog`
- **Queue:** event-driven on status transition
- **Risks:** status flapping creates duplicate entries
- **Tests:** exactly-once offer log tests

## 14 - Deadline Alert System
- **Trigger:** Notion search poll
- **Services:** Notion, Telegram HTTP
- **Input/Output:** deadlines due in next 2 days -> alert + warned flag
- **Filters:** deadline window + status `New` + not warned
- **Workflow:** search -> notify -> mark warned
- **Errors:** Global retries
- **Storage:** Notion
- **Side effects:** Telegram alerts
- **Limitations:** hardcoded token URL; no multi-level escalation policy
- **Replacement:** policy-driven deadline evaluator
- **Worker:** `deadline-alert-worker`
- **API:** `POST /automation/modules/deadline-alert/run`
- **Models:** `Job`, `AutomationLog`
- **Queue:** scheduled evaluator queue
- **Risks:** date-only vs datetime mismatch
- **Tests:** T-2/T-1/T-0 boundary tests

## 15 - Lifecycle Monitoring Engine
- **Trigger:** Notion search poll
- **Services:** Notion
- **Input/Output:** stale `New` records (>30 days) -> lifecycle updates
- **Filters:** status `New`, `dateFound <= now-30d`
- **Workflow:** search -> update lifecycle fields
- **Errors:** Global retries
- **Storage:** Notion
- **Side effects:** status changes
- **Limitations:** fixed threshold and no transition history
- **Replacement:** lifecycle policy engine with audit transition log
- **Worker:** `lifecycle-monitoring-worker`
- **API:** `POST /automation/modules/lifecycle-monitoring/run`
- **Models:** `Job`, `AutomationLog`, `AuditLog`
- **Queue:** daily scheduled batch
- **Risks:** missing dateFound values, manual overrides
- **Tests:** threshold and override precedence tests

## 16 - Daily Status Digest
- **Trigger:** Notion search poll
- **Services:** Notion, Router, Text Aggregator, Telegram
- **Input/Output:** active status rows -> aggregated digest text -> Telegram
- **Filters:** excludes Rejected/Withdrawn, requires status
- **Workflow:** search -> route -> aggregate -> send
- **Errors:** Global retries
- **Storage:** source in Notion, output not persisted
- **Side effects:** Telegram digest
- **Limitations:** limit=10 under-reporting risk, no persisted artifact
- **Replacement:** persisted daily report generation + send log
- **Worker:** `daily-digest-worker`
- **API:** `POST /reports/daily-digest/run`
- **Models:** `Report`, `AutomationLog`
- **Queue:** daily scheduler + notify queue
- **Risks:** message length limits and pagination misses
- **Tests:** complete pagination and snapshot format tests

## 17 - Weekly Performance Report
- **Trigger:** Notion search poll (multiple metric queries)
- **Services:** Notion, SetVariable, Google Sheets, Email
- **Input/Output:** 7-day metrics by status -> weekly summary -> sheet row + email
- **Filters:** date windows and status segments
- **Workflow:** run metric queries -> compute vars -> append sheet -> send email
- **Errors:** Global retries
- **Storage:** Notion source + Sheets sink
- **Side effects:** sheet writes + emails
- **Limitations:** many sequential queries, no normalized report artifact, partial success risk
- **Replacement:** single analytics compute job + persisted report + fan-out delivery
- **Worker:** `weekly-report-worker`
- **API:** `POST /reports/weekly/run`, `POST /reports/:id/send-test`
- **Models:** `Report`, `AutomationLog`
- **Queue:** weekly scheduler + delivery queue
- **Risks:** week-boundary timezone, duplicate same-week runs
- **Tests:** week-window and idempotent weekly rerun tests
