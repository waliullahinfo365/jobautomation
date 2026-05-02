# Queue and Scheduler Foundation

## Queue architecture
- API enqueues automation requests through `automation-queue.service`.
- Worker queue abstraction is implemented in `apps/workers/src/queues/automation.queue.ts`.
- Dispatcher routes each queue job name to a processor in `apps/workers/src/processors/automation.dispatcher.ts`.
- Long-running module endpoints queue by default and support `?execute=true` for dev/test direct execution.

## Queue modes
- `memory` mode (default): safe local/dev queue stub, non-durable, no Redis required.
- `bullmq` mode: auto-enabled when `REDIS_URL` exists and BullMQ/ioredis can be resolved.
- `disabled` mode: enqueue calls return skipped status.

## API enqueue behavior
- `POST /automation/modules/:moduleKey/run` now enqueues by default for all 17 module keys.
- If `execute=true`, direct execution is allowed only in non-production.
- In production, `execute=true` returns forbidden to enforce queue-first behavior.

## Worker dispatch behavior
- Implemented modules route to existing processors:
  - job-intake, duplicate-protection, folder-automation, applied-status, interview-scheduling
  - cv-routing, email-reply-detection, follow-up-reminder, pdf-export
  - research-document, ai-processing, daily-digest, weekly-report
- Not yet implemented modules return safe non-crashing responses:
  - network-follow-up, offer-tracking, deadline-alert, lifecycle-monitoring

## Idempotency rules
- Queue facade generates deterministic idempotency keys per module/resource pattern.
- Worker memory queue keeps short-lived idempotency map to skip duplicate enqueue attempts.
- BullMQ mode uses idempotency key as jobId when available (best effort).

## Scheduler functions
`apps/workers/src/schedulers/automation.scheduler.ts` includes:
- `scheduleDailyDigestForAllTenants()`
- `scheduleWeeklyReportsForAllTenants()`
- `scheduleFollowUpReminderSweep()`
- `scheduleDeadlineAlertSweep()`
- `scheduleLifecycleMonitoringSweep()`
- `scheduleNetworkFollowUpSweep()`

All scheduler functions:
- query active/trialing tenants
- enqueue one job per tenant
- attach operationId/idempotencyKey per tenant + period
- avoid cron daemon coupling for now

## Dev testing
- Queue-first (default): call endpoint normally and verify queued response.
- Immediate execution (dev/test only): append `?execute=true`.
- Optional inline worker behavior:
  - set `QUEUE_INLINE_EXECUTION=true` to execute queued memory jobs immediately.

## Future production setup
- Install/configure BullMQ + Redis and set `REDIS_URL`.
- Add dedicated worker consumers and graceful shutdown hooks.
- Add repeatable schedules (cron/BullMQ repeat jobs) behind `SCHEDULER_ENABLED=true`.
- Add dead-letter/retry monitoring and queue metrics dashboards.

## Current limitations
- Memory queue is non-durable and process-local.
- BullMQ path is optional and dependency/runtime-gated.
- Scheduler currently callable functions only; no daemonized cron loop yet.
