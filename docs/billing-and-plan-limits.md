# Billing and Plan Limits (Stub Foundation)

## Plans

Subscription keys: `free_trial`, `starter`, `pro`, `agency`, `enterprise`.

Full definitions (pricing, features, limits) live in `packages/shared/src/constants/plans.ts` as `PLAN_DEFINITIONS`.

Display names remain aligned with legacy tenant `plan` strings (`Free Trial`, `Starter`, etc.).

## Limits (per tenant)

| Limit | Usage field | Notes |
|-------|-------------|--------|
| `maxJobs` | `jobsCount` | Job create + intake |
| `maxAutomationRuns` | `automationRunsThisMonth` | Queue enqueue (success) |
| `maxAiCredits` | `aiCreditsUsedThisMonth` | AI generation (estimated credits) |
| `maxUsers` | `usersCount` | `assertCanAddUser` (future user invites) |
| `maxStorageMb` | `storageUsedMb` | Recalculate from documents metadata |
| `maxIntegrations` | `integrationsCount` | Connect integration placeholder |
| `maxReportsPerMonth` | `reportsGeneratedThisMonth` | Daily/weekly report generation |

Enterprise plan uses `"unlimited"` limits in definitions; checks treat those as no cap.

## Usage metrics

Stored on `Tenant.usage` and reconciled via `POST /billing/recalculate-usage` or `GET /tenants/usage?recalculate=true`.

## Billing endpoints

All require `x-tenant-id` (and normal auth) except the public webhook.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/billing/plan` | Current plan snapshot, limits, usage, percentages, catalog |
| GET | `/billing/usage` | Usage counters only |
| POST | `/billing/checkout` | Stub checkout (`checkoutUrl` fake) |
| POST | `/billing/change-plan` | Stub plan change + limits sync + audit log |
| POST | `/billing/cancel` | Stub cancel (`cancelAtPeriodEnd`) |
| POST | `/billing/recalculate-usage` | Recompute usage from DB |
| POST | `/billing/webhook` | Public stub Stripe webhook (no verification) |

## Stub checkout

Returns:

- `checkoutUrl`: `https://billing.example.local/checkout/{sessionId}`
- `sessionId`: deterministic stub id
- No Stripe API calls.

## Where limits are enforced

- `POST /jobs` — `assertCanCreateJob`; increments `jobsCount` on success.
- Job intake (`processJobIntakeEmail`) — before `JobModel.create`; increments `jobsCount`.
- `enqueueAutomationModule` — `assertCanRunAutomation`; increments `automationRunsThisMonth` when queue accepts (`queued` / `scheduled`, not `skipped`).
- AI processing (`runResearchGeneration` / `runDraftGeneration`) — `assertCanUseAiCredits` before work; increments credits after stub usage.
- Report generation (`generateDailyDigest` / `generateWeeklyReport`) — `assertCanGenerateReport`; increments `reportsGeneratedThisMonth` after upsert.
- `POST /integrations/:provider/connect` — `assertCanAddIntegration`.

Blocked actions return **402** `PLAN_LIMIT` with message: *Plan limit reached. Upgrade your plan to continue.*  
An `AutomationLog` with `moduleKey: billing` and `status: Warning` is written.

## How to test locally

1. Set tenant headers: `x-tenant-id`, `x-user-id` (non-production dev user is optional).
2. `GET /billing/plan` — inspect limits vs usage.
3. `POST /billing/change-plan` with `{ "planKey": "starter" }` — limits should update.
4. `POST /billing/checkout` — receive fake `checkoutUrl`.
5. Exhaust a limit (e.g. lower `maxJobs` in DB) and `POST /jobs` — expect 402.
6. `POST /billing/recalculate-usage` — counters refresh from models.

## TODO (production)

- Real Stripe Checkout / Customer / Subscription APIs.
- Webhook signature verification and idempotent event handling.
- Customer portal and invoice PDFs.
- Proration, tax, and billing address.
- Hard enforcement in workers (queue consumers) mirroring API checks.
