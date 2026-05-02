# Application Workflow Pipeline (Phase 4 Stub)

## What is implemented
- Tenant-safe applied status automation (`mark applied` updates application + related job).
- Follow-up scheduling and due follow-up processing with reminder deduping.
- Deterministic Gmail reply detection and classification with application/job status transitions.
- Automation module runner support for:
  - `applied-status`
  - `follow-up-reminder`
  - `email-reply-detection`

## Endpoints
- `POST /applications/:id/mark-applied`
- `POST /applications/:id/schedule-follow-up`
- `POST /applications/:id/mark-follow-up-sent`
- `GET /applications/follow-ups/due`
- `POST /applications/follow-ups/process-due`
- `POST /integrations/gmail/reply-webhook`
- `POST /integrations/gmail/reply-test`

## Example curl: mark applied
```bash
curl -X POST http://localhost:4000/applications/<applicationId>/mark-applied \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant-id" \
  -d '{}'
```

## Example curl: schedule follow-up
```bash
curl -X POST http://localhost:4000/applications/<applicationId>/schedule-follow-up \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant-id" \
  -d '{"followUpDate":"2026-05-10T09:00:00.000Z","message":"Follow up on application status"}'
```

## Example curl: process due follow-ups
```bash
curl -X POST http://localhost:4000/applications/follow-ups/process-due \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant-id" \
  -d '{}'
```

## Example curl: reply-test
```bash
curl -X POST http://localhost:4000/integrations/gmail/reply-test \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant-id" \
  -d '{"providerMessageId":"msg-123","providerThreadId":"thread-123","from":"recruiter@example.com","subject":"Interview invitation","bodyText":"Can we schedule an interview call next week?","receivedAt":"2026-05-02T00:00:00.000Z"}'
```

## Idempotency behavior
- Applied status uses key: `applied-status:<tenantId>:<applicationId>:<dateApplied>`
- Due follow-up processing skips duplicate reminders by `followUpReminderKey`.
- Email reply detection skips reprocessing when `lastProviderMessageId` matches incoming payload.

## Current limitations
- Gmail webhook validation is stub-only.
- SMTP sends are stub-only (no real email delivery).
- Calendar event creation is not implemented.

## TODO
- Real Gmail webhook signature validation and OAuth integration.
- Real SMTP transport and delivery/error handling.
- Calendar interview event creation from interview-intent replies.
