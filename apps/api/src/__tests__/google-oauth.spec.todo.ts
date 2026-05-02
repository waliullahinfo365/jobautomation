/**
 * Google OAuth preparation — planned tests (enable with runner + DB).
 *
 * - auth-url returns demo URL when Google client env is missing
 * - state JWT encodes tenant / user / provider and expires in 10 minutes
 * - callback rejects invalid or expired state
 * - callback upserts IntegrationConnection with encrypted token fields
 * - list integrations never returns raw access/refresh tokens
 * - provider slug mapping matches `SLUG_TO_PROVIDER`
 */

export {};
