# Production readiness checklist

Use this before going live or after major infrastructure changes.

## Security

- [ ] No secrets in git; use platform env vars / secret managers.
- [ ] `JWT_SECRET`, `ENCRYPTION_KEY`, and DB credentials are long, random, and rotated on compromise.
- [ ] API CORS in production allows only `APP_URL` (no wildcard).
- [ ] Production errors do not expose stack traces to clients; `requestId` is returned on errors.
- [ ] Helmet enabled; CSP disabled for JSON API as documented.
- [ ] Rate limiting and abuse controls planned for public endpoints (future hardening).

## Environment

- [ ] `NODE_ENV=production` on API and workers.
- [ ] `validateApiEnv` / `validateWorkerEnv` pass (or `FORCE_ENV_VALIDATION` in CI).
- [ ] `LOG_LEVEL` set appropriately (`info` or `warn` in prod).
- [ ] `API_PUBLIC_URL` and `APP_URL` match real HTTPS URLs.

## Database

- [ ] MongoDB Atlas network access and user least privilege.
- [ ] Backups and retention configured (Atlas backup or snapshots).
- [ ] Indexes reviewed for hot paths (see application models).

## Auth

- [ ] JWT expiry and refresh strategy documented.
- [ ] Demo/dev headers disabled in production (`ALLOW_DEV_AUTH_HEADERS` not used for real tenants).

## Billing

- [ ] Stripe keys and webhook secret in env; webhook URL points to production API.
- [ ] Test mode vs live mode clearly separated between environments.

## Integrations

- [ ] Google OAuth redirect URIs match `API_PUBLIC_URL` and Google Cloud Console.
- [ ] Integration credentials stored encrypted; no plaintext in logs.

## Queue / workers

- [ ] `QUEUE_MODE` and `REDIS_URL` aligned; avoid `memory` queue in production for durability.
- [ ] Workers deployed with same `MONGODB_URI` and crypto keys as API.
- [ ] Scheduler flags (`SCHEDULER_ENABLED`) intentional.

## Monitoring

- [ ] Structured logs (Pino) shipped to your log aggregator.
- [ ] Uptime checks on `/health/ready` (API).
- [ ] Error tracking (e.g. Sentry) considered for API and web.

## Backups

- [ ] Database backup restore tested once.
- [ ] Disaster recovery owner and runbook.

## Testing

- [ ] CI green: `pnpm type-check`, builds for web, API, workers.
- [ ] Smoke test: login, one critical API flow, one worker path if applicable.

## Launch checklist

- [ ] Deployment order followed (see `docs/deployment-guide.md`).
- [ ] Demo seed only on non-production or isolated demo tenant.
- [ ] Rollback path verified (previous release artifact available).
