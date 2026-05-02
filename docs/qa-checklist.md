# QA checklist

Use before client demos or releases.

## Auth

- [ ] Register creates tenant + owner user; JWT returned
- [ ] Login returns JWT; invalid password rejected
- [ ] Protected routes reject requests without auth (production / `ALLOW_DEV_AUTH_HEADERS=false`)

## Tenant isolation

- [ ] API queries scoped by `tenantId`; no cross-tenant IDs in responses
- [ ] Dev headers (`x-tenant-id`) only apply outside production when allowed

## Jobs

- [ ] List / detail / create / update / archive
- [ ] Intake test creates or updates job from synthetic email body
- [ ] Duplicate check returns deterministic result for fingerprinted jobs
- [ ] Generate research / draft (queued vs execute in dev)

## Applications

- [ ] CRUD and filters
- [ ] Mark applied updates status pipeline
- [ ] Follow-up scheduling and process-due endpoint
- [ ] Reply test (`/integrations/gmail/reply-test`) classifies stub payload

## Contacts

- [ ] List / create / update
- [ ] Follow-up fields display correctly

## Interviews

- [ ] List / create / update
- [ ] Create calendar event (stub path)

## Documents

- [ ] List / create / update
- [ ] Export PDF (stub path)

## Reports

- [ ] Daily digest run + weekly run return success envelope
- [ ] History list loads

## Automation

- [ ] Modules list shows 17 keys per tenant after seed
- [ ] Logs list paginates; failed entries visible on System Status when API up

## Billing

- [ ] Plan + usage endpoints return stub-safe data (no live Stripe)

## Integrations

- [ ] Catalog list shows Gmail, Drive, Calendar, OpenAI, SMTP, Slack states after seed
- [ ] Health endpoint aggregates connection status

## API fallback

- [ ] Web operates with `NEXT_PUBLIC_USE_MOCK_FALLBACK=true` when API offline (read-heavy views)
- [ ] Demo Walkthrough steps show friendly errors when POST fails or IDs missing

## Deployment health

- [ ] `GET /health` returns database + queue summary
- [ ] `GET /system/status` (authenticated) returns billing + integration snapshot
- [ ] Workers process queue when `REDIS_URL` + BullMQ configured (optional)

## Demo-specific

- [ ] `pnpm seed:demo` completes without duplicate key violations on second run
- [ ] `/demo` checklist runs without crashing when API offline
- [ ] `pnpm smoke:api` passes against local API
