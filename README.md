# JobFlow monorepo

Multi-tenant SaaS job-application automation platform: **Next.js** dashboard (`apps/web`), **Express** API (`apps/api`), **workers** for queues and automation (`apps/workers`), plus shared libraries (`packages/shared`, `packages/database`, `packages/integrations`).

## Monorepo layout

| Path | Description |
|------|-------------|
| `apps/web` | Next.js 14 frontend |
| `apps/api` | Express API, auth/RBAC, webhooks, integrations |
| `apps/workers` | Queue processors and schedulers |
| `packages/shared` | Types, constants, env schema helpers |
| `packages/database` | Mongoose models and seeds |
| `packages/integrations` | Gmail, Drive, AI adapters (stubs / safe defaults) |

## Prerequisites

- **Node.js 20+**
- **pnpm 10** (`corepack enable` recommended)
- **MongoDB** for local and production (Atlas in prod)

## Environment

Copy `.env.example` to `.env` at the repo root and fill in values. Never commit real secrets.

Key variables:

- **API / workers:** `MONGODB_URI`, `JWT_SECRET`, `APP_URL`, `API_PUBLIC_URL`, `ENCRYPTION_KEY`
- **Web:** `NEXT_PUBLIC_API_URL`
- **Optional:** `REDIS_URL`, `QUEUE_MODE`, Google OAuth, Stripe, AI keys (see `.env.example`)

Production validation runs when `NODE_ENV=production` (API, workers, web build). See `packages/shared/src/env/env-schema.ts` for categorized reference.

## Local setup

```bash
pnpm install
pnpm --filter @jobflow/workers build
cp .env.example .env
# Edit .env — set MONGODB_URI and secrets
pnpm seed:demo
pnpm dev
```

`pnpm dev` runs the web app (with API and workers in dev per `turbo.json`). The first `workers` build ensures the automation queue package exists for API enqueue calls.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Dev: web (+ api/workers per turbo) |
| `pnpm dev:web` / `dev:api` / `dev:workers` | Individual apps |
| `pnpm build` | Turbo build all |
| `pnpm build:web` / `build:api` / `build:workers` | Scoped builds |
| `pnpm start:api` / `start:workers` | Production-style start (after `build`) |
| `pnpm type-check` | TypeScript across workspaces |
| `pnpm lint` | Lint (placeholders in some packages) |
| `pnpm seed:demo` | Demo tenant seed |

## Deployment

See **[docs/deployment-guide.md](docs/deployment-guide.md)** for Vercel, Railway/Docker, env vars, health checks, and order of rollout.

**[docs/production-readiness-checklist.md](docs/production-readiness-checklist.md)** covers security, data, and launch checks.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs install, type-check, and builds for web, API, and workers on push/PR.

## API health

- `GET /health` — full status
- `GET /health/ready` — readiness (MongoDB connected)
- `GET /health/live` — liveness (not shutting down)

## License

Private / proprietary unless otherwise stated.
# job-automation
