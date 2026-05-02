# Authentication, RBAC, and security foundation

This document describes how auth, tenant isolation, RBAC, auditing, and baseline production hardening work in Jobflow’s API (`apps/api`) and how the web client attaches credentials (`apps/web`).

## Auth flow

### Registration (`POST /auth/register`)

1. Validates payload (`name`, `email`, `password` ≥ 8 chars, `workspaceName`).
2. Ensures email is unique.
3. Creates a **Tenant** (slug derived from workspace name) and an **Owner** **User** with hashed password (`bcrypt`).
4. Seeds automation modules for the tenant (`seedAutomationModules`).
5. Returns `{ user, tenant, accessToken }` (JWT).

### Login (`POST /auth/login`)

1. Finds user by normalized email, verifies password and **Active** status.
2. Updates `lastLoginAt`.
3. Returns `{ user, tenant, accessToken }`.

### Session (`GET /auth/me`)

Requires `Authorization: Bearer <JWT>`. Returns `{ user, tenant }` without secrets.

### Logout (`POST /auth/logout`)

Stub success; clients should delete stored tokens locally.

## JWT vs developer headers

### Bearer token (all environments)

When present, `Authorization: Bearer <token>` is verified (`JWT_SECRET`). The payload carries:

- `userId`
- `tenantId`
- `role`
- `email`

`tenant.middleware.ts` prefers **`req.user.tenantId`** from the JWT. Client bodies **must not** override tenant for authorization.

### Developer fallback (`NODE_ENV !== production`)

If **`ALLOW_DEV_AUTH_HEADERS`** is not `"false"`:

- With **`x-user-id`** + **`x-tenant-id`**, those identify the user (optional **`x-user-role`**).
- With neither header, defaults **`DEMO_USER_ID`** / **`DEMO_TENANT_ID`** apply so existing demos keep working.

### Production without JWT

Protected routes return **401**. **`x-user-role` is never trusted for privilege escalation in production**—RBAC uses only the role embedded in a verified JWT.

## Roles

Aligned with `tenantRoles` in `@jobflow/shared`:

| Role   | Typical use                          |
| ------ | ------------------------------------ |
| Owner  | Full workspace control             |
| Admin  | Almost full; no destructive billing update / user removal (see permissions) |
| Member | CRUD on pipeline entities; read automation & integrations |
| Viewer | Read-only product surfaces           |

## Permissions

Canonical strings live in `packages/shared/src/constants/permissions.ts` (`Permission`, `ROLE_PERMISSIONS`, `roleHasPermission`).

**Highlights**

- **Owner**: all permissions.
- **Admin**: all except `billing.update` and `users.remove`.
- **Member**: CRUD on jobs / applications / contacts / interviews / documents; `reports.generate`; read automation & integrations; **no** `automation.run` / `automation.update`.
- **Viewer**: read-only (`*.read`, `reports.read`, etc.).

## Protected routes & RBAC

- Global **`authMiddleware`** (skip list: `/health`, `/billing/webhook`, `/auth/register`, `/auth/login`).
- Global **`tenantMiddleware`** (same skip list; resolves `req.tenantId`).
- Route-level **`requirePermission`** / **`requireAnyPermission`** on resource routers (jobs, applications, billing, automation, reports, …).

## Tenant resolution

1. JWT → `req.user.tenantId`.
2. Else non-production → `x-tenant-id` header (demo).
3. Else error **`TENANT_REQUIRED`**.

Do **not** authorize using `tenantId` from JSON bodies.

## Audit logs

`apps/api/src/services/audit-log.service.ts`:

- `createAuditLog`, `logAuthEvent`, `logSecurityEvent`, `logTenantAudit`.

Logged today (non-exhaustive): registration, login, billing plan change (stub), integration connect/disconnect (stub), automation module run (queued).

Avoid auditing high-volume GET traffic.

## Rate limiting

`authRateLimiter`: **20 requests / 15 minutes / IP** on **`/auth/login`** and **`/auth/register`**. Skipped in `NODE_ENV=test`. Uses `trust proxy` for sensible IPs behind a proxy.

## Security hardening (API)

- **Helmet** enabled.
- **CORS**: `APP_URL` used as origin in production (`apps/api/src/config/cors.ts`).
- **JSON body limit**: `1mb`.
- **Trust proxy**: `1` hop.

## Frontend token storage

- `getAuthToken` / `setAuthToken` / `clearAuthToken` in `apps/web/src/lib/api/client.ts`.
- Storage key: `NEXT_PUBLIC_AUTH_TOKEN_KEY` or default `jobflow_access_token`.
- With a token, requests send **`Authorization: Bearer`** and omit demo `x-*` headers; without a token, **`x-tenant-id`** / **`x-user-id`** behave as before.

## Production TODOs

- Refresh tokens / rotation, secure cookie sessions for browsers.
- Password reset & email verification flows.
- OAuth with Google/Microsoft (connect integrations).
- Redis-backed rate limiting; IP allowlists for webhooks.
- Central audit sink & SIEM export.
