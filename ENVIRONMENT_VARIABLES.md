# Environment Variables

## Required (app will not start without these)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting OAuth tokens at rest |

## AI (Anthropic)

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `CLAUDE_API_KEY` | Alias for `ANTHROPIC_API_KEY` (checked if primary not set) | — |
| `ANTHROPIC_MODEL` | Model ID to use | `claude-3-5-sonnet-latest` |

At least one of `ANTHROPIC_API_KEY` / `CLAUDE_API_KEY` is required for AI modules (offer tracking, network follow-up, CV routing, job intake).

## Google OAuth

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI (e.g. `https://yourapp.com/api/integrations/google/callback`) |

Required for Google Calendar (optional). Direct Gmail OAuth and Google Drive are not used for beta customers — use Unipile for Gmail job alerts and Firebase Storage for documents.

## Unipile (Gmail job-alert intake) — Required for beta email

| Variable | Description |
|----------|-------------|
| `UNIPILE_DSN` | Unipile API DSN (e.g. `https://apiXX.unipile.com:XXXXX`) |
| `UNIPILE_API_KEY` | Unipile Access Token |
| `UNIPILE_EMAIL_INTAKE_ENABLED` | Set `false` to pause intake (`true` by default) |
| `UNIPILE_WEBHOOK_SECRET` | Optional shared secret sent as `X-Unipile-Webhook-Secret` |
| `UNIPILE_PORT` | Optional port query param when custom ports are blocked |

Also set `API_PUBLIC_URL` and `APP_URL` so hosted auth callbacks and webhook registration use public HTTPS URLs.

## Firebase Storage (documents) — Required for beta CVs

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (escape newlines as `\\n`) |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket name |

## Email (Resend)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender address (e.g. `noreply@yourdomain.com`) |

Both required to enable email delivery (password reset, follow-up reminders, reports). App runs without them (those emails are skipped; password reset links are logged server-side only).

## Notifications

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Telegram chat/channel ID |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |

All optional. Only the configured channels receive automation event notifications.

## Queue / Redis

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | — |

Without `REDIS_URL`, BullMQ is disabled and jobs run in an in-memory queue (non-durable, lost on restart).

## Billing (Stripe) — Optional

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_PRO` | Stripe price ID for Pro plan |
| `STRIPE_PRICE_ENTERPRISE` | Stripe price ID for Enterprise plan |

Billing tab in Settings is hidden when these are not set. No stubs — if set, real Stripe API is called.

## App Config

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `4000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `FRONTEND_URL` | Frontend origin for CORS and redirects | `http://localhost:3000` |
| `API_URL` | API base URL (used by frontend) | `http://localhost:4000` |
| `NEXT_PUBLIC_API_URL` | Same as `API_URL`, exposed to browser | `http://localhost:4000` |

## Automation Tuning

| Variable | Description | Default |
|----------|-------------|---------|
| `NETWORK_FOLLOWUP_STALE_DAYS` | Days since last contact before follow-up reminder triggers | `30` |
| `DEMO_TENANT_ID` | Tenant ID used for demo/seeding scripts only | — |
