# Billing and Plan Limits

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

All require auth + tenant context except the public webhook.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/billing/plan` | Current plan snapshot, limits, usage, percentages, catalog |
| GET | `/billing/usage` | Usage counters only |
| POST | `/billing/checkout` | Stripe Checkout session (`checkoutUrl`) |
| POST | `/billing/portal` | Stripe Customer Portal session |
| POST | `/billing/change-plan` | Direct plan change (blocked when Stripe is configured unless `ALLOW_DIRECT_PLAN_CHANGE=true`) |
| POST | `/billing/cancel` | Schedule subscription cancel at period end |
| POST | `/billing/recalculate-usage` | Recompute usage from DB |
| POST | `/billing/webhook` | Stripe webhook (signature verified when `STRIPE_WEBHOOK_SECRET` is set) |

See [stripe-setup.md](./stripe-setup.md) for Dashboard and env configuration.

## Where limits are enforced

- `POST /jobs` — `assertCanCreateJob`; increments `jobsCount` on success.
- Job intake (`processJobIntakeEmail`) — before `JobModel.create`; increments `jobsCount`.
- `enqueueAutomationModule` — `assertCanRunAutomation`; increments `automationRunsThisMonth` when queue accepts (`queued` / `scheduled`, not `skipped`).
- AI processing (`runResearchGeneration` / `runDraftGeneration`) — `assertCanUseAiCredits` before work; increments credits after usage.
- Report generation (`generateDailyDigest` / `generateWeeklyReport`) — `assertCanGenerateReport`; increments `reportsGeneratedThisMonth` after upsert.
- `POST /integrations/:provider/connect` — `assertCanAddIntegration`.

Blocked actions return **402** `PLAN_LIMIT` with message: *Plan limit reached. Upgrade your plan to continue.*  
An `AutomationLog` with `moduleKey: billing` and `status: Warning` is written.

## How to test locally

1. Set Stripe test keys and price IDs (see `stripe-setup.md`).
2. `GET /billing/plan` — inspect limits vs usage and `stripeConfigured`.
3. Settings → Billing → Upgrade — complete Stripe test checkout.
4. Exhaust a limit and `POST /jobs` — expect 402.
5. `POST /billing/recalculate-usage` — counters refresh from models.
