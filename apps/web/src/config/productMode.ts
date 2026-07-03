/** Customer-facing SaaS roles (mirrors API `user.productRole`). */
export type ProductRole = "user" | "admin" | "super_admin";

const PRODUCT_ROLES: readonly ProductRole[] = ["user", "admin", "super_admin"];

export function isProductRole(value: unknown): value is ProductRole {
  return typeof value === "string" && PRODUCT_ROLES.includes(value as ProductRole);
}

/** Normal job seeker — simplified product experience. */
export function isSimpleCustomerMode(role: ProductRole | string | null | undefined): boolean {
  return role === "user" || !role;
}

/** Workspace / account administrator. */
export function isAdminMode(role: ProductRole | string | null | undefined): boolean {
  return role === "admin";
}

/** Platform owner / internal operator. */
export function isSuperAdmin(role: ProductRole | string | null | undefined): boolean {
  return role === "super_admin";
}

/**
 * Advanced automation, system, and operator UI.
 * Enabled for super admins or when `NEXT_PUBLIC_ADVANCED_UI=true`.
 */
export function isAdvancedUiEnabled(role?: ProductRole | string | null | undefined): boolean {
  if (isSuperAdmin(role)) return true;
  if (isAdminMode(role)) return true;
  return process.env.NEXT_PUBLIC_ADVANCED_UI === "true";
}

/** Fallback when API has not yet returned `productRole`. */
export function resolveProductRoleFromTenantRole(
  tenantRole: string | undefined,
  isSuperAdminFlag?: boolean
): ProductRole {
  if (isSuperAdminFlag) return "super_admin";
  if (tenantRole === "Owner" || tenantRole === "Admin") return "admin";
  return "user";
}

export function normalizeProductRole(user: {
  productRole?: string | null;
  role?: string;
  preferences?: Record<string, unknown>;
}): ProductRole {
  if (isProductRole(user.productRole)) return user.productRole;
  const prefs = user.preferences ?? {};
  return resolveProductRoleFromTenantRole(user.role, prefs.isSuperAdmin === true);
}
