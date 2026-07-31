/**
 * Routes that skip authentication and tenant context requirements.
 * (Register/login are unauthenticated; billing webhook is signed separately.)
 */
export function isPublicApiPath(path: string): boolean {
  return (
    path === "/health" ||
    path === "/health/live" ||
    path === "/health/ready" ||
    path === "/billing/webhook" ||
    path === "/auth/register" ||
    path === "/auth/login" ||
    path === "/integrations/google/callback" ||
    path === "/integrations/google/demo-callback" ||
    path === "/integrations/unipile/notify" ||
    path === "/integrations/unipile/webhook"
  );
}
