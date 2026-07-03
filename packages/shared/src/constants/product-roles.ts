/** SaaS product roles — distinct from workspace `TenantRole` (Owner/Admin/Member/Viewer). */
export const PRODUCT_ROLES = ["user", "admin", "super_admin"] as const;

export type ProductRole = (typeof PRODUCT_ROLES)[number];

/** Platform owner — always treated as `super_admin` (case-insensitive email match). */
export const OWNER_EMAIL = "info@benjaminkueper.com";

export function isProductRole(value: unknown): value is ProductRole {
  return typeof value === "string" && (PRODUCT_ROLES as readonly string[]).includes(value);
}

export function isPlatformOwnerEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === OWNER_EMAIL;
}

/**
 * Maps workspace membership + super-admin flag to the customer-facing product role.
 * Super admins are identified server-side (env allowlist, platform owner email, or `preferences.isSuperAdmin`).
 */
export function resolveProductRole(input: {
  tenantRole: string;
  isSuperAdmin?: boolean;
  email?: string | null;
}): ProductRole {
  if (input.isSuperAdmin || isPlatformOwnerEmail(input.email)) return "super_admin";
  if (input.tenantRole === "Owner" || input.tenantRole === "Admin") return "admin";
  return "user";
}
