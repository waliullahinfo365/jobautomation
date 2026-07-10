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

- **Mobile-first (default):** Users apply via **Apply Assistant** (`/jobs/:id/apply`) on phone — CV/cover letter share, AI answers, one-tap status log. No LinkedIn server session required.
- **`LINKEDIN_CLOUD_AUTO_APPLY_ENABLED`**: Set to `true` only for desktop beta — enables Railway Playwright auto-apply sweep, session keep-alive, and `POST /jobs/:id/apply`. **Leave `false` in production** to avoid LinkedIn account logouts.
- **`NEXT_PUBLIC_LINKEDIN_CLOUD_AUTO_APPLY_ENABLED`**: Mirrors the flag in the web app (Settings LinkedIn session card + Auto Apply buttons).
- **`PROXY_URL` / `PLAYWRIGHT_PROXY_URL`**: Only needed when cloud auto-apply is enabled. LinkedIn binds `li_at` to egress IP.
- **Pinned proxy**: On cookie import (UI or API), the server stores the proxy URL **encrypted on the session row** (`metadata.playwrightProxyEncrypted`). Apply, keep-alive, and credential re-login use **pinned → env** so rotating or missing env vars do not silently change egress after cookies were created.
- **Re-import once** after upgrading if sessions predate pinning: open **Connect → Import Cookies**, paste the same proxy as your browser export (or leave empty so the current server `PROXY_URL` is pinned).

## Web Push (mobile PWA)

- **`VAPID_PUBLIC_KEY`**, **`VAPID_PRIVATE_KEY`**, **`VAPID_SUBJECT`**: Set on the **API** service (Railway). Generate with `npx web-push generate-vapid-keys`. Subject is usually `mailto:you@domain.com`.
- Users enable push in the app (dashboard banner or Settings → Notifications). Requires HTTPS and the service worker at `/sw.js`.

## Desktop Apply Agent (optional)

- Runs **locally** on Mac/PC with your real IP — not cloud Playwright.
- Settings → Integrations → **Desktop automation**: generate a 6-digit pairing code.
- From repo root: `pnpm apply-agent pair --code 123456 --api-url https://api.newjob.guru`
- Log in to LinkedIn once: `pnpm apply-agent login linkedin`
- Poll and apply: `pnpm apply-agent run --interval 120000`
- Optional Chrome extension: load `extensions/linkedin-apply-assistant/` unpacked in `chrome://extensions`.

## Gmail job intake (workers)

- **`SCHEDULER_ENABLED=true`**: Required on the **workers** service for timed automation (including Gmail intake).
- **`GMAIL_INTAKE_INTERVAL_MS`**: How often each tenant’s **job-intake** sweep is enqueued (default **300000** = 5 minutes).
- **`GMAIL_INTAKE_MAX_MESSAGES`**: Max Gmail messages listed per intake run (default **50**, max **100**). Larger values cost more Gmail API quota and AI calls.
- **Settings → Scan Now**: Manual wider inbox scan in the web app; the scheduled worker run uses the **job-intake Gmail search** (labels / boards / keywords), not the same query as the manual full-inbox scan.
