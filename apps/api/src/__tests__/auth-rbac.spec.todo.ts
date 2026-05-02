/**
 * Planned integration tests — enable when a test runner + DB harness are wired.
 *
 * Cases:
 * - register creates tenant + owner user and returns JWT
 * - login returns JWT and updates lastLoginAt
 * - GET /auth/me succeeds with Bearer token
 * - protected route returns 401 without token when NODE_ENV=production (and ALLOW_DEV_AUTH_HEADERS=false in dev)
 * - Viewer cannot POST /jobs (jobs.create)
 * - Member cannot POST /billing/change-plan (billing.update)
 * - tenantId in JSON body cannot override JWT tenant (tenant-scoped update ignores body tenantId)
 * - dev headers (x-user-id / x-tenant-id) work only outside production with ALLOW_DEV_AUTH_HEADERS=true
 */

export {};
