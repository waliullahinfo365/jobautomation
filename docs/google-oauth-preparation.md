# Google OAuth preparation (Gmail, Drive, Calendar)

## Current behavior

- **Stub mode (default in local dev):** If `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `GOOGLE_REDIRECT_URI` are missing, `GOOGLE_OAUTH_ENABLED` is false. The “Connect with Google” button receives a **demo authorization URL** that points at `GET /integrations/google/demo-callback` on this API. The **authorization code is never exchanged with Google**; `exchangeCodeForTokensStub` and `getGoogleAccountProfileStub` return fixed placeholders.
- **OAuth-prepared mode:** With all Google env vars set, the auth URL is the real `https://accounts.google.com/o/oauth2/v2/auth` endpoint. Token exchange is still **stubbed** until the TODO below is implemented.

## Routes (API)

| Method | Path | Auth |
|--------|------|------|
| GET | `/integrations/google/:provider/auth-url` | Yes — `integrations.connect` |
| GET | `/integrations/google/callback` | Public (Google redirect) |
| GET | `/integrations/google/demo-callback` | Public (local demo flow) |

`:provider` is one of `gmail`, `google-drive`, `google-calendar`.

`auth-url` response:

```json
{
  "authorizationUrl": "...",
  "provider": "gmail",
  "oauthEnabled": true
}
```

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Must match Google Cloud console (e.g. `http://localhost:4000/integrations/google/callback`) |
| `JWT_SECRET` | Signs OAuth `state` JWT (10-minute TTL) |
| `ENCRYPTION_KEY` | **Required in production** for encrypting stored tokens; in development, missing key stores with `dev-insecure-plain:` prefix (logged warning) |
| `API_PUBLIC_URL` | Optional; base URL for demo callback links (defaults `http://localhost:${PORT}`) |
| `APP_URL` | Frontend base for redirects after callback (e.g. `http://localhost:3000`) |

## Scopes per provider

Defined in `packages/shared/src/constants/googleScopes.ts` and exposed via `getGoogleScopesForProvider`.

- **Gmail:** `gmail.readonly`, `gmail.modify`
- **Google Drive:** `drive.file`
- **Google Calendar:** `calendar.events`

## State handling

- `createOAuthState` issues a short-lived JWT (`typ: google_oauth_state`) containing `tenantId`, `userId`, `provider`, `nonce`, `createdAt`.
- Callbacks **must** pass `state`; tenant and provider are taken **only** from verified JWT, never from untrusted query parameters alone.

## Token encryption (placeholder)

`apps/api/src/utils/encryption.ts` uses AES-256-GCM when `ENCRYPTION_KEY` is set.

- **TODO:** KMS envelope encryption, key rotation, and separate secrets per tenant if required.
- Access/refresh tokens are stored in `accessTokenEncrypted` / `refreshTokenEncrypted` on `IntegrationConnection` and are **never** returned from list/detail APIs.

## Frontend flow

1. User opens **Connect** on a Google card → modal shows **Connect with Google** and **Connect Demo**.
2. **Connect with Google** → `GET /integrations/google/:slug/auth-url` → browser navigates to `authorizationUrl`.
3. Google (or demo callback) redirects to API → `handleGoogleOAuthCallback` → redirect to `APP_URL/settings?integration=connected&provider=...`.
4. Settings reads query string, shows toast, refetches integrations, clears query via `router.replace("/settings")`.

## Demo callback flow

When OAuth is disabled, `authorizationUrl` is:

`{API_PUBLIC_URL}/integrations/google/demo-callback?state=<jwt>`

No `code` from Google; the handler uses a fixed demo code internally.

## TODO (production)

- Real **token exchange** (`POST https://oauth2.googleapis.com/token`).
- **Refresh token** rotation and re-auth UX.
- **Gmail** push/watch or polling for inbox.
- **Drive** and **Calendar** API calls using stored tokens.
- Tighten **CSP** and **redirect URI** allowlists.
