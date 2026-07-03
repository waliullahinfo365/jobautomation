/** SaaS product roles — distinct from workspace `TenantRole` (Owner/Admin/Member/Viewer). */
export const PRODUCT_ROLES = ["user", "admin", "super_admin"] as const;

export type ProductRole = (typeof PRODUCT_ROLES)[number];

export function isProductRole(value: unknown): value is ProductRole {
  return typeof value === "string" && (PRODUCT_ROLES as readonly string[]).includes(value);
}

/**
 * Maps workspace membership + super-admin flag to the customer-facing product role.
 * Super admins are identified server-side (env allowlist or `preferences.isSuperAdmin`).
 */
export function resolveProductRole(input: {
  tenantRole: string;
  isSuperAdmin?: boolean;
}): ProductRole {
  if (input.isSuperAdmin) return "super_admin";
  if (input.tenantRole === "Owner" || input.tenantRole === "Admin") return "admin";
  return "user";
}
