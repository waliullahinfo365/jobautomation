# Deployment readiness — Vercel (web) + Railway (API + workers) + MongoDB Atlas

This document is the operator checklist for pushing this monorepo to GitHub and deploying **apps/web** (Vercel), **apps/api** (Railway), **apps/workers** (Railway), with **MongoDB Atlas**. **Do not commit `.env` files or real secrets.**

---

## If `.env` was ever committed

Git will keep tracking a file until you remove it from the index (your local file can stay):

```bash
git rm --cached .env
git rm --cached apps/web/.env.local
git commit -m "Stop tracking env files"
```

Then ensure root `.gitignore` covers all env patterns (see repository `.gitignore`).

---

## A. Pre-push checklist

1. `git status` — no unintended secrets or `.env` in the commit.
2. Confirm `.env` / `.env.local` are **not** tracked: `git ls-files | grep -E '\.env' | grep -v example` should be empty.
3. Run from repository root:
   - `pnpm type-check`
   - `pnpm build` (or per-package builds below)
4. Push to GitHub.

---

## B. GitHub push (example)

```bash
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## C. MongoDB Atlas

1. Create a cluster (e.g. M0 for testing).
2. Create a database user (username + password).
3. Network access: for initial Railway testing you may use `0.0.0.0/0` (tighten later to Railway egress or private networking if available).
4. Connection string: `MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER.mongodb.net/jobflow-ai?retryWrites=true&w=majority`
5. **Put `MONGODB_URI` only in Railway** for the **API** and **Workers** services — **never** in Vercel frontend env.

---

## D. Railway — API service

- **Source:** connect the GitHub repo.
- **Dockerfile:** use repository root **`Dockerfile.api`** (see `railway.json` at repo root).
- **Health check path:** `/health/ready` (checks DB connection; returns 503 until Mongo is connected).
- **Start:** container runs `node dist/apps/api/src/server.js` with `NODE_ENV=production`. **Railway sets `PORT`** — the API reads `process.env.PORT`.

### API environment variables (copy names from root `.env.example`)

Set at minimum:

- `NODE_ENV=production`
- `PORT` — usually injected by Railway (do not hardcode if the platform sets it).
- `MONGODB_URI` — Atlas connection string.
- `JWT_SECRET` — long random string (required in production).
- `APP_URL` — **exact** Vercel app origin, e.g. `https://your-app.vercel.app` (used for CORS: only this origin is allowed in production for browser requests).
- `API_PUBLIC_URL` — **public base URL of this API**, e.g. `https://your-api.up.railway.app` (OAuth redirects, emails, demo links).
- `GOOGLE_REDIRECT_URI` — `https://YOUR-RAILWAY-API-DOMAIN/integrations/google/callback`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_PROJECT_ID` (when enabling Google).
- `ENCRYPTION_KEY` — 32-byte secret for token encryption in production (see app validation).
- `ALLOW_DEV_AUTH_HEADERS` — set **`false`** in production.
- `DEMO_MODE_ENABLED` — `false` unless you explicitly allow `POST /demo/reset` in prod.
- Queue/redis/scheduler vars as needed (`REDIS_URL`, `QUEUE_MODE`, etc.).

### After deploy

- `curl https://YOUR-API/health` — should return JSON without auth.
- `curl https://YOUR-API/health/ready` — should return 200 when DB is connected.

---

## E. Railway — Workers service

Create a **second** Railway service from the **same** repo.

- **Dockerfile:** **`Dockerfile.workers`** (see `railway.workers.json` in the repo for reference; Railway UI may ask you to select this file explicitly).
- **No public URL required** — workers are background processes.
- **Environment:** same `MONGODB_URI` (and shared secrets/redis as your workers code expects). Align `QUEUE_MODE`, `REDIS_URL`, `SCHEDULER_*` with production design.

> **Note:** Root `railway.json` is tuned for the **API** image only. The **workers** service must be configured separately in Railway to use `Dockerfile.workers`.

---

## F. Vercel — Web (`apps/web`)

### Option 1 — Vercel project **root** = monorepo root (recommended for `apps/web/vercel.json`)

- **Root Directory:** can stay default (repo root) if `vercel.json` lives under `apps/web` — in the Vercel dashboard, set **Root Directory** to **`apps/web`** so Vercel picks up `apps/web/vercel.json`, **or** set root to repo root and add a project `vercel.json` at root (current setup uses `apps/web/vercel.json`).
- **Install command:** `cd ../.. && pnpm install --frozen-lockfile` (already in `apps/web/vercel.json` when building from `apps/web`).
- **Build command:** `cd ../.. && pnpm --filter @jobflow/web build` (already set).

**Typical dashboard settings when Root Directory = `apps/web`:**

- Framework: Next.js
- Install: `cd ../.. && pnpm install --frozen-lockfile`
- Build: `cd ../.. && pnpm --filter @jobflow/web build`
- Output: Next.js default (`.next`)

### Frontend environment (Vercel)

Set **only** public, safe variables:

- `NEXT_PUBLIC_API_URL` — **https://your-railway-api.up.railway.app** (no trailing slash issues — match your client)
- `NEXT_PUBLIC_USE_MOCK_FALLBACK` — `false` in production once API is live
- `NEXT_PUBLIC_AUTH_TOKEN_KEY` — e.g. `jobflow_access_token`
- `NEXT_PUBLIC_DEMO_TENANT_ID` / `NEXT_PUBLIC_DEMO_USER_ID` — only if needed for demo UX

**Never** set `MONGODB_URI`, `JWT_SECRET`, or provider secrets on Vercel.

---

## G. Google OAuth — after deployment

In **Google Cloud Console** → OAuth client:

**Authorized JavaScript origins**

- `http://localhost:3000`
- `https://YOUR-VERCEL-DOMAIN.vercel.app`

**Authorized redirect URIs**

- `http://localhost:4000/integrations/google/callback`
- `https://YOUR-RAILWAY-API-DOMAIN.up.railway.app/integrations/google/callback`

In **Railway API** env:

- `GOOGLE_REDIRECT_URI=https://YOUR-RAILWAY-API-DOMAIN.up.railway.app/integrations/google/callback`
- `API_PUBLIC_URL=https://YOUR-RAILWAY-API-DOMAIN.up.railway.app`
- `APP_URL=https://YOUR-VERCEL-DOMAIN.vercel.app`

---

## H. Pub/Sub — after API URL exists

When Gmail push is ready:

- Create the subscription in Google Cloud.
- **Push endpoint:**  
  `https://YOUR-RAILWAY-API-DOMAIN.up.railway.app/integrations/gmail/pubsub`  
  (exact path must match your API route implementation.)

---

## I. First production test

1. Register / log in via the Vercel app.
2. Connect Gmail / Drive / Calendar (stubs or real, per flags).
3. Run the **Demo Walkthrough** (`/demo`) if enabled.
4. Open **System Status** (`/system-status`) and confirm API health.

---

## J. Do not enable until tested

Keep these **`false`** until credentials and behavior are verified end-to-end:

- `GMAIL_WATCH_ENABLED`
- `DRIVE_REAL_API_ENABLED`
- `CALENDAR_REAL_API_ENABLED`
- `CLAUDE_REAL_API_ENABLED`
- `GOOGLE_REAL_API_ENABLED` (when present in your integration layer)

If a flag is `true` but credentials are missing, the API should return a **clear error** — not crash the server (verify per route when enabling).

---

## K. Go-live sequence (summary)

1. Atlas + `MONGODB_URI` on Railway API & workers.
2. Deploy API → verify `/health` and `/health/ready`.
3. Deploy workers → check logs for DB + queue startup.
4. Point Vercel `NEXT_PUBLIC_API_URL` at Railway API; deploy web.
5. Set `APP_URL` / `API_PUBLIC_URL` / `GOOGLE_REDIRECT_URI` on Railway.
6. Update Google OAuth origins/redirects.
7. Seed production DB (see below) if needed.
8. Run smoke test (see below).

---

## Seeding production / demo data

- **Local:** `pnpm seed:demo` (runs `packages/database` demo seed; idempotent by design in code).
- **Production Atlas:** run the same command **once** from a trusted machine with `MONGODB_URI` pointing at Atlas (temporary env — do not commit), **or** use a Railway one-off / local script execution against production URI. Document who is allowed to run seeds.

---

## Smoke test

**Local (with dev headers):**

```bash
pnpm smoke:api
```

Uses root `.env` via `dotenv -e .env` (see root `package.json`).

**Production:** obtain a JWT after login, then:

```bash
SMOKE_AUTH_TOKEN="your-jwt" API_URL="https://your-api.up.railway.app" pnpm exec tsx scripts/smoke-api.ts
```

Do not commit tokens. `GET /health` in the script does not require auth; other steps need a valid bearer if dev headers are disabled.

---

## Feature flags (reference)

The root `.env.example` includes flags such as `GOOGLE_REAL_API_ENABLED`, `GMAIL_WATCH_ENABLED`, etc. Wire them in integration code as you harden providers; until then keep **`false`** in production.

---

## CORS (current behavior)

- **Production:** browser requests must come from **`APP_URL`** exactly (plus localhost in development). Requests with **no `Origin`** header may still be allowed (e.g. server tools) — see `apps/api/src/config/cors.ts`.
- **Never** use `*` for allowed origins in production.

---

## Health routes (API)

| Route            | Auth   | Purpose                          |
|-----------------|--------|----------------------------------|
| `GET /health`   | Public | Summary (includes DB state name) |
| `GET /health/live` | Public | Liveness (not shutting down)  |
| `GET /health/ready` | Public | Readiness (DB connected) — **use for Railway** |

---

## Files touched for deployment

| File | Role |
|------|------|
| `Dockerfile.api` | Railway API image |
| `Dockerfile.workers` | Railway workers image |
| `railway.json` | API Dockerfile + `/health/ready` |
| `railway.workers.json` | Reference for workers Dockerfile |
| `apps/web/vercel.json` | Monorepo pnpm install/build |
| `.env.example` | Root env template |
| `apps/web/.env.example` | Next public vars template |
| `.gitignore` | Env + build artifacts |
| `.dockerignore` | Docker build context |
