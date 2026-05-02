# Integrations setup flow (stub / demo)

## Supported providers

| Provider        | Slug              | Notes                                      |
|-----------------|-------------------|--------------------------------------------|
| Gmail           | `gmail`           | Stub only; no Gmail API or OAuth           |
| Google Drive    | `google-drive`    | Stub only                                  |
| Google Calendar | `google-calendar` | Stub only                                  |
| OpenAI          | `openai`          | Demo config; API keys masked in responses |
| Claude          | `claude`          | Demo config; API keys masked in responses |
| SMTP            | `smtp`            | Demo host/port/user/from only             |
| Notion Legacy   | `notion-legacy`   | Legacy import metadata stub               |
| Slack           | `slack`           | Workspace/channel stub                    |

## Backend endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/integrations` | `integrations.read` |
| GET | `/integrations/health` | `integrations.read` |
| POST | `/integrations/:provider/connect` | `integrations.connect` |
| POST | `/integrations/:provider/disconnect` | `integrations.disconnect` |
| POST | `/integrations/:provider/test` | `integrations.connect` |
| GET | `/integrations/google/:provider/auth-url` | `integrations.connect` |
| GET | `/integrations/google/callback` | Public (OAuth redirect) |
| GET | `/integrations/google/demo-callback` | Public (demo when Google env unset) |

`POST .../connect` body (all optional): `connectedEmail`, `accountName`, `config`, `scopes`.

## Connection record behavior

- Per-tenant `IntegrationConnection` documents keyed by `tenantId` + `provider`.
- **Connect** upserts a row with status **Connected**, merges **non-secret** config into `metadata`, masks `apiKey` / passwords into `*Preview` fields, and writes audit **`integration.connected`**.
- **Disconnect** sets status **Disabled**, clears connection fields, resets `metadata` to a minimal stub, and writes **`integration.disconnected`**.
- **Test** returns deterministic **Success** / **Warning** / **Failed** based on status (no outbound calls). Writes **`integration.tested`** and stores `metadata.lastTest` on the row.

## Stub vs real OAuth

- Current implementation stores **stub** metadata (`stub: true`) and never exchanges OAuth codes or calls Google/Slack/Notion APIs.

### Google OAuth (prepared flow)

- **Settings → Integrations** offers **Connect with Google** (redirect) and **Connect Demo** (existing POST `/integrations/:provider/connect`) for Gmail, Google Drive, and Google Calendar.
- OAuth routes, signed `state`, demo callback, and token encryption placeholders are documented in **`docs/google-oauth-preparation.md`**.
- Audit action **`integration.oauth_connected`** is written when the OAuth callback completes (still using stub token exchange until production).

### TODO — production

- Real **Google OAuth** (Gmail, Drive, Calendar) with encrypted refresh tokens.
- **Encrypted token storage** at rest (KMS / envelope encryption).
- **OpenAI / Claude** live API keys with rotation and billing metering.
- **SMTP** live connectivity check (test send / STARTTLS probe).
- **Slack** OAuth or incoming webhook verification.

## Frontend setup modal

`IntegrationConnectModal` collects provider-specific demo fields and posts to `POST /integrations/:provider/connect`. Google providers show a notice that OAuth will replace this flow in production.

## Security notes

- Raw API keys are **never** returned from the API; only masked previews (e.g. `sk-••••1234`) may appear in `metadata`.
- Responses strip known secret keys (`apiKey`, `password`, `accessToken`, etc.) before serialization.

## Local testing

1. Run API and web (`pnpm dev` at repo root or per app).
2. Open **Settings → Integrations**.
3. Use **Connect** / **Test** / **Disconnect**; with API up, data persists per tenant in MongoDB.
4. With API down and `NEXT_PUBLIC_USE_MOCK_FALLBACK=true`, actions update **local demo state** and show mock lists + health.
