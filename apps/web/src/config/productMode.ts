/** Customer-facing SaaS roles (mirrors API `user.productRole`). */
export type ProductRole = "user" | "admin" | "super_admin";

/** Platform owner — always treated as `super_admin` (case-insensitive email match). */
export const OWNER_EMAIL = "info@benjaminkueper.com";

const PRODUCT_ROLES: readonly ProductRole[] = ["user", "admin", "super_admin"];

export type SessionUserLike = {
  productRole?: string | null;
  role?: string;
  email?: string | null;
  preferences?: Record<string, unknown>;
};

function isPlatformOwnerEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === OWNER_EMAIL;
}

export function isProductRole(value: unknown): value is ProductRole {
  return typeof value === "string" && PRODUCT_ROLES.includes(value as ProductRole);
}

/** Normal job seeker — simplified product experience. */
export function isSimpleCustomerMode(role: ProductRole | string | null | undefined): boolean {
  return role === "user" || !role;
}

/** Workspace / account administrator (API may still return this; UI treats as normal user). */
export function isAdminMode(role: ProductRole | string | null | undefined): boolean {
  return role === "admin";
}

/** Platform owner / internal operator. */
export function isSuperAdmin(role: ProductRole | string | null | undefined): boolean {
  return role === "super_admin";
}

/**
 * Effective product role for navigation, route guards, and UI visibility.
 * Only the platform owner email or an explicit super-admin flag qualifies.
 */
export function getEffectiveUserRole(user: SessionUserLike): ProductRole {
  if (isPlatformOwnerEmail(user.email)) return "super_admin";
  if (user.productRole === "super_admin") return "super_admin";
  const prefs = user.preferences ?? {};
  if (prefs.isSuperAdmin === true) return "super_admin";
  return "user";
}

export function isSuperAdminUser(user: SessionUserLike): boolean {
  return getEffectiveUserRole(user) === "super_admin";
}

export function canSeeAdvancedNavigation(user: SessionUserLike): boolean {
  return isSuperAdminUser(user);
}

/**
 * Advanced automation, system, and operator UI — super admins only.
 * `NEXT_PUBLIC_ADVANCED_UI` does not grant access to normal users.
 */
export function isAdvancedUiEnabled(role?: ProductRole | string | null | undefined): boolean {
  return isSuperAdmin(role);
}

/** @deprecated Prefer `getEffectiveUserRole` — kept for legacy call sites. */
export function resolveProductRoleFromTenantRole(
  tenantRole: string | undefined,
  isSuperAdminFlag?: boolean
): ProductRole {
  if (isSuperAdminFlag) return "super_admin";
  void tenantRole;
  return "user";
}

export function normalizeProductRole(user: SessionUserLike): ProductRole {
  return getEffectiveUserRole(user);
}
