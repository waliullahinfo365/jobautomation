# Job Intake Pipeline (Phase 2 Stub)

## Endpoint Usage
- `POST /jobs/intake-email`: accepts normalized intake payload from Gmail/manual sources.
- `POST /jobs/intake-test`: simplified local testing endpoint that generates provider metadata.
- `POST /jobs/:id/check-duplicate`: runs duplicate analysis against existing tenant jobs.

## Example Request (`/jobs/intake-test`)
```bash
curl -X POST http://localhost:4000/jobs/intake-test \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant-id" \
  -d '{"from":"alerts@linkedin.com","subject":"Software Engineer at Acme Inc","bodyText":"Acme Inc is hiring a Software Engineer in Toronto. Apply: https://example.com/job/123"}'
```

## Example Response
```json
{
  "success": true,
  "message": "Job intake test processed",
  "data": {
    "operationId": "c9a7....",
    "tenantId": "demo-tenant-id",
    "status": "created",
    "jobId": "6813....",
    "duplicateCheck": {
      "status": "Unique",
      "duplicateScore": 0,
      "reasons": ["No duplicate signals found"]
    },
    "extraction": {
      "company": "Acme Inc",
      "position": "Software Engineer",
      "source": "test",
      "confidence": 0.82
    },
    "logs": ["job-intake:start", "duplicate-protection:unique", "job-intake:success"]
  }
}
```

## Fingerprint and Idempotency Logic
- Fingerprint is SHA-256 over normalized `tenantId + company + position + jobUrl`.
- Unique sparse index on `Job(tenantId, fingerprintHash)` prevents duplicate inserts.
- `providerMessageId` is checked per-tenant before processing; repeated messages are skipped.
- `AutomationLog.idempotencyKey` stores `job-intake:<tenantId>:<providerMessageId>` for retry safety.

## Duplicate Protection Rules
- Exact fingerprint match => `Duplicate` with score `1.0`.
- Same normalized job URL => `Duplicate` with score `1.0`.
- Same company + similar role title (exact/contains/token overlap) => `Possible Duplicate` with score `>= 0.75`.
- Otherwise => `Unique`.
- Records are never auto-deleted; classification only.

## Current Limitations
- Gmail OAuth/webhooks are stubbed only (no real provider token flow).
- AI extraction uses deterministic parsing rules (no external model calls).
- Worker queue is placeholder-only (no BullMQ/Redis yet).

## TODO (Next Iteration)
- Implement real Gmail OAuth + webhook signature verification.
- Implement production AI provider wrapper with schema-constrained output.
- Move intake execution to queue workers with retry policy and DLQ.
