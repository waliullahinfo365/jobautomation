# SaaS Multi-tenant Plan

- Each customer account maps to one `tenant` (workspace).
- Every record must include `tenantId` for strict data isolation.
- Users belong to a tenant and receive role-based access (`Owner`, `Admin`, `Member`, `Viewer`).
- Integration credentials are stored per tenant.
- Automation jobs execute in tenant context and log by tenant.
- Billing plan controls feature limits and automation throughput.

## Billing and enforcement (stub)

- Each tenant has `billing.planKey`, nested billing fields, `limits` (caps), and `usage` (counters). Legacy top-level `plan` and `billingStatus` remain for backward compatibility.
- Plan definitions and limit keys live in `packages/shared` (`PLAN_DEFINITIONS`, `SubscriptionPlanKey`).
- API services: `billing.service` (plan snapshot, stub checkout/change/cancel/webhook), `usage.service` (recalculate, increment/decrement), `plan-limit.service` (assert helpers, 402 on block).
- Limits are enforced on job creation, job intake, automation enqueue, AI runs, report generation, and integration connect. See `docs/billing-and-plan-limits.md`.
- Stripe is not connected; checkout and webhooks are deterministic stubs suitable for future replacement.
