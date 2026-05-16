# Production Feature Status

Last updated: 2026-05-16

## Module Status

| Module | Status | Notes |
|--------|--------|-------|
| **Applications** | ✅ Production-ready | Live email/job links, date filters, i18n |
| **Interviews** | ✅ Production-ready | All mock data removed |
| **Jobs** | ✅ Production-ready | |
| **Contacts / Networking** | ✅ Production-ready | |
| **Reports** | ✅ Production-ready | |
| **Offer Tracking** | ✅ Production-ready | Anthropic classifier, saves offer details to Application, in-app notifications |
| **Network Follow-Up** | ✅ Production-ready | Anthropic suggestion, daily idempotency, in-app bell notifications (no auto-email send) |
| **Interview Scheduling** | ✅ Production-ready | Real Google Calendar API via worker processor; handles not-connected gracefully |
| **Folder Automation** | ✅ Production-ready | Real Google Drive API |
| **Document Upload** | ✅ Production-ready | Real Google Drive API |
| **CV Routing / Job Intake** | ✅ Production-ready | Real Gmail + Anthropic parsing |
| **Deadline Alerts** | ✅ Production-ready | |
| **Follow-Up Reminders** | ✅ Production-ready | |
| **System Status** | ✅ Production-ready | Real per-service health checks, no fake data |
| **Billing / Stripe** | ⏸ Hidden (not activated) | Code is real (no stubs); Billing tab hidden in settings until Stripe env vars are configured |
| **Integrations** | ✅ Production-ready | OAuth flows for Gmail, Drive, Calendar; env-var flows for Resend, Telegram, Slack, Anthropic |

## AI / Anthropic Policy

- Only Anthropic is used. No OpenAI.
- Model: reads `ANTHROPIC_MODEL` env, defaults to `claude-3-5-sonnet-latest`.
- On failure: AI status is marked `Failed` or `Needs Attention` — no fake content is generated.
- Never logs full CV, cover letter, job description, or API keys.

## Known Limitations

- **Billing tab**: Hidden until `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_*` env vars are set and Stripe is activated.
- **Automation worker heartbeat** (System Status): Inferred from most recent automation log timestamp; not a real keepalive ping.
- **Dead Next.js API routes** (`apps/web/src/app/api/`): Return 501. Frontend uses the Express API directly; these routes are unused.
- **Network Follow-Up**: Generates AI suggestions and in-app reminders only — does not send external emails.
