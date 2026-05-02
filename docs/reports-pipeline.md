# Reports Pipeline (Phase 6 Stubbed)

## What is implemented
- Tenant-safe daily digest and weekly performance aggregation services.
- Report persistence with period keys, metrics, summary, recommendations, idempotency keys, and delivery status.
- Stubbed report delivery flow (`sendReportEmailStub`) with delivery ID tracking.
- API endpoints for report generation, send-test, stats, and analytics-only metric reads.
- Automation module execution support for `daily-digest` and `weekly-report`.
- Worker-ready processors/jobs for future queue integration.

## What is stubbed
- No real SMTP/Gmail/Slack/Telegram/Sheets/Notion/Stripe integration.
- No real PDF generation/attachments.
- No real scheduler queue orchestration (BullMQ/Redis still TODO).

## Daily digest flow
1. API or automation run triggers generation.
2. Tenant-scoped daily metrics are aggregated from jobs/applications/interviews/automation logs.
3. Deterministic summary + recommendations are produced.
4. Report is upserted by `tenant + type + periodKey`.
5. Optional stub send updates delivery status and sent metadata.
6. Automation logs capture start/success/failure with idempotency key.

## Weekly performance flow
1. API or automation run triggers generation.
2. Tenant-scoped weekly metrics + rates + source breakdown are aggregated.
3. Deterministic recommendations are generated from metric thresholds.
4. Report is upserted by `tenant + type + periodKey`.
5. Optional stub send updates delivery status and sent metadata.
6. Automation logs capture start/success/failure with idempotency key.

## Report send-test flow
1. Existing report is looked up tenant-safely.
2. Delivery status moves to `Queued`.
3. Stub email send returns deterministic delivery ID.
4. Report is updated to `deliveryStatus=Sent`, `status=Sent`, and `sentAt/sentTo/deliveryId`.
5. Automation log written for success/failure.

## Endpoints
- `POST /reports/daily-digest/run`
- `POST /reports/weekly/run`
- `POST /reports/:id/send-test`
- `GET /reports/stats`
- `GET /reports/analytics/daily`
- `GET /reports/analytics/weekly`
- `POST /automation/modules/:moduleKey/run` with `moduleKey` in `{daily-digest, weekly-report}` and `execute=true`

## Example curl: daily digest
```bash
curl -X POST "http://localhost:4000/reports/daily-digest/run" \
  -H "x-tenant-id: <tenantId>" \
  -H "content-type: application/json" \
  -d '{"date":"2026-05-02","send":false,"force":false}'
```

## Example curl: weekly report
```bash
curl -X POST "http://localhost:4000/reports/weekly/run" \
  -H "x-tenant-id: <tenantId>" \
  -H "content-type: application/json" \
  -d '{"weekStart":"2026-04-27","weekEnd":"2026-05-03","send":true}'
```

## Example curl: report send-test
```bash
curl -X POST "http://localhost:4000/reports/<reportId>/send-test" \
  -H "x-tenant-id: <tenantId>" \
  -H "content-type: application/json" \
  -d '{"to":"qa@example.local"}'
```

## Idempotency behavior
- Daily digest key: `daily-digest:<tenantId>:<YYYY-MM-DD>`
- Weekly key: `weekly-report:<tenantId>:<weekStart_to_weekEnd>`
- Existing period report is returned on repeat calls unless `force=true`.
- Send-test writes distinct delivery actions while preserving report identity.

## Current limitations
- Delivery is stub-only (`status=Sent` is simulated).
- Analytics are database-derived snapshots with deterministic recommendations.
- Automation execute/queue behavior is API-level, not backed by real job queue yet.

## TODO
- Real SMTP + optional Slack delivery integrations.
- Real PDF report attachment generation and storage.
- Queue-backed scheduling/execution (BullMQ/Redis workers).
