# Backend Implementation Roadmap

## Phase 1 — Core Backend Foundation
- **Auth / RBAC foundation implemented**: JWT login & registration, bcrypt passwords, `ROLE_PERMISSIONS`, route-level RBAC middleware, audit hooks for auth/billing/integrations/automation, dev header fallback preserved, rate limiting on auth endpoints (see `docs/auth-rbac-security.md`).
- Harden tenant-safe query helpers across services.
- Add CRUD endpoints for jobs/applications/contacts/interviews/documents/reports.
- Persist automation execution logs in `AutomationLog`.
- Add standardized error handling, request IDs, and audit log writes.

## Phase 2 — Gmail Intake
- Status: In progress (stub architecture implemented, external providers still mocked).
- Added Gmail normalization/verification stubs and deterministic AI extraction stub in `packages/integrations`.
- Added `/jobs/intake-email` and `/jobs/intake-test` endpoints with tenant-safe intake flow.
- Added fingerprint + duplicate-protection services with idempotency-safe logging.
- Added worker processors/stubs for `job-intake` and `duplicate-protection` (queue integration TODO).

## Phase 3 — AI Processing
- Status: In progress (stub architecture implemented; **AI provider preparation** complete — real SDK calls still TODO).
- Added deterministic AI generation stubs for research and cover letter drafts.
- Added tenant-safe API service flows for `/jobs/:id/generate-research`, `/jobs/:id/generate-draft`, and full AI processing.
- Added idempotent document generation behavior (no duplicate research/draft creation when already generated).
- **AI provider preparation**: shared AI types/constants, `AiUsageLog`, `ai-provider-config` + `ai-usage` services, encrypted OpenAI/Claude keys on connect, `GET/POST /ai/*` endpoints, integrations package `runAi*` wrappers (stub-first), usage logging for job-extraction / research / draft. See `docs/ai-provider-preparation.md`.

## Phase 4 — Application Workflow
- Status: In progress (stub architecture implemented, integrations still mocked).
- Added applied status service to mark applications as Applied and sync related Job status.
- Added follow-up reminder scheduling + due processing with idempotent reminder key handling.
- Added email reply detection service with deterministic classification rules and application/job updates.
- Added worker-ready stubs/processors for applied-status, follow-up-reminder, and email-reply-detection.

## Phase 5 — Google Integrations
- Status: Implemented with deterministic stubs (no external OAuth/API calls yet).
- Added Drive folder automation + CV routing + PDF export base services and endpoints.
- Added interview calendar-event scheduling service with idempotent dedupe behavior.
- Added integration test stub responses for Google Drive/Calendar.
- Added worker-ready processors/jobs for folder-automation, cv-routing, pdf-export, interview-scheduling.
- Real provider retry/backoff and transient error handling remains TODO for live integrations.

## Phase 6 — Reports
- Status: Implemented with deterministic stubs (no real delivery providers).
- Added tenant-safe daily digest and weekly performance analytics aggregation services.
- Added report generation + persistence with period keys and idempotent re-run behavior.
- Added stub report delivery flow and report send-test endpoint wiring.
- Added analytics endpoints (`/reports/stats`, `/reports/analytics/daily`, `/reports/analytics/weekly`).
- Added worker-ready daily/weekly processors and worker exports (queue integration TODO).

## Integration setup foundation

- Status: **Implemented** (stub persistence only — no real OAuth or external provider calls).
- Service: `apps/api/src/services/integration.service.ts` — catalog merge, Mongo upsert, masked secrets, deterministic test results, audit logs (`integration.connected`, `integration.disconnected`, `integration.tested`).
- Routes: `GET /integrations`, `GET /integrations/health`, `POST .../connect|disconnect|test` with RBAC and `integration.validator.ts`.
- See `docs/integrations-setup-flow.md`.

## Phase 7 — SaaS Billing + Hardening
- Status: Billing **foundation stubbed** (no real Stripe). Plan catalog, tenant billing/usage/limit fields, stub checkout/change/cancel/webhook, usage recalculation, plan-limit assertions on key API paths, and **RBAC on billing routes** (`billing.read` / `billing.update`) are in place.
- Stripe integration implementation (checkout/webhooks/plan sync) — TODO.
- Enforce per-plan limits in API and workers — API path started; worker-side enforcement TODO.
- Add robust audit trails for critical mutations.
- Add retry policies, DLQ, and on-call alerting hooks.
- Prepare production deployment topology and autoscaling.

## Queue + Scheduler Foundation
- Status: Implemented with safe memory-first queue mode and optional BullMQ path.
- Added shared queue job contracts for all 17 automation module keys.
- Added worker queue abstraction, dispatcher routing, and runtime lifecycle helpers.
- Added scheduler sweep functions that enqueue per active tenant with idempotency keys.
- Updated long-running API endpoints to enqueue by default; `execute=true` is dev-safe and blocked in production.
