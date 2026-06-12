# Environment Setup

Use root `.env.example` as source of required variables.

## Core
- `NODE_ENV`, `APP_URL`, `API_URL`

## Database/Auth
- `MONGODB_URI`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

## Billing
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Integrations
- Google OAuth credentials, AI keys, SMTP settings

## LinkedIn Playwright (Easy Apply)

- **`PROXY_URL` / `PLAYWRIGHT_PROXY_URL`**: HTTP(S) proxy used by workers for headless LinkedIn. LinkedIn binds `li_at` to egress IP.
- **Pinned proxy**: On cookie import (UI or API), the server stores the proxy URL **encrypted on the session row** (`metadata.playwrightProxyEncrypted`). Apply, keep-alive, and credential re-login use **pinned → env** so rotating or missing env vars do not silently change egress after cookies were created.
- **Re-import once** after upgrading if sessions predate pinning: open **Connect → Import Cookies**, paste the same proxy as your browser export (or leave empty so the current server `PROXY_URL` is pinned).

## Gmail job intake (workers)

- **`SCHEDULER_ENABLED=true`**: Required on the **workers** service for timed automation (including Gmail intake).
- **`GMAIL_INTAKE_INTERVAL_MS`**: How often each tenant’s **job-intake** sweep is enqueued (default **300000** = 5 minutes).
- **`GMAIL_INTAKE_MAX_MESSAGES`**: Max Gmail messages listed per intake run (default **50**, max **100**). Larger values cost more Gmail API quota and AI calls.
- **Settings → Scan Now**: Manual wider inbox scan in the web app; the scheduled worker run uses the **job-intake Gmail search** (labels / boards / keywords), not the same query as the manual full-inbox scan.
