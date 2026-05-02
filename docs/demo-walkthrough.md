# Demo walkthrough

End-to-end guided demo for client and investor presentations.

## Prerequisites

- MongoDB running locally or reachable via `MONGODB_URI`
- Node.js and `pnpm` installed

## Seed demo data

From the monorepo root:

```bash
pnpm seed:demo
```

This ensures:

- **Tenant**: Demo JobFlow AI Workspace (`demo-jobflow-ai-workspace` slug; legacy `demo-workspace` is renamed when present)
- **Owner**: `owner@demo.local` (placeholder password hash — use **Register** in the app for real auth, or dev headers)
- **Counts**: 17 automation modules, 12 jobs, 8 applications, 8 contacts, 5 interviews, 15 documents, 6 reports, 30 automation logs, integration connection stubs

Seeding is **idempotent**: safe to run multiple times.

After seeding, copy the **MongoDB `_id`** of the tenant document into `.env` if you want dev headers to hit that tenant:

- `DEMO_TENANT_ID` (API)
- `NEXT_PUBLIC_DEMO_TENANT_ID` (web)

Defaults (`demo-tenant-id`) only match your DB if you configured them that way.

## Run services

Terminal A — API:

```bash
pnpm dev:api
```

Terminal B — Web:

```bash
pnpm dev:web
```

Terminal C (optional) — Workers:

```bash
pnpm dev:workers
```

## Login / register flow

1. Open `http://localhost:3000/register` and create a workspace (real JWT path), **or**
2. Stay logged out and rely on **dev headers** (`x-tenant-id` / `x-user-id`) — same behavior as the web client when no Bearer token is stored.

## Demo Walkthrough page

Open **Demo Walkthrough** in the sidebar (`/demo`).

Each step:

- Explains what product capability is being exercised
- **Run step** calls the live API (with mock fallback when the API is unavailable)
- Shows a **result preview** (truncated JSON)
- Links to the relevant surface

Steps map to:

| Step | Capability |
|------|------------|
| Integrations | Settings → integrations health |
| Intake test | `POST /jobs/intake-test` |
| Duplicate check | `POST /jobs/:id/check-duplicate` |
| Research / Draft | Job AI endpoints |
| Applied / Follow-ups / Reply | Application workflow + Gmail reply stub |
| Calendar | Interview calendar stub |
| PDF | Document export |
| Reports | Daily digest + weekly report |
| Logs | Automation logs |
| Billing | Billing plan |

### Reset demo data

**Reset Demo Data** calls `POST /demo/reset` (requires API; Owner/Admin via `automation.update` permission).

- Enabled when `NODE_ENV !== production` **or** `DEMO_MODE_ENABLED=true`
- Re-runs the idempotent seed for the **current tenant** (from JWT or dev headers)

If the API is down, the UI shows: **Demo reset requires the API.**

## Fallback mode demo

With `NEXT_PUBLIC_USE_MOCK_FALLBACK=true` (default in `.env.example`), list endpoints return bundled mock data when the API errors or is unreachable. Steps that **require** a POST may still fail gracefully with a clear message; entity-dependent steps disable when IDs are missing.

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Empty dashboard after seed | `DEMO_TENANT_ID` / `NEXT_PUBLIC_DEMO_TENANT_ID` align with seeded tenant `_id` |
| 403 on reset | User role must be Owner or Admin (Members lack `automation.update`) |
| 404 on reset in production | Set `DEMO_MODE_ENABLED=true` or run outside production |
| Mongo connection errors | `MONGODB_URI`, firewall, Atlas IP allowlist |

## Smoke test

```bash
pnpm smoke:api
```

Calls `/health`, `/billing/plan`, `/jobs/intake-test`, `/automation/logs`, `/reports/daily-digest/run` using dev headers.
