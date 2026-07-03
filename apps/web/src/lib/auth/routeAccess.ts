import {
  getEffectiveUserRole,
  isSuperAdmin,
  isSuperAdminUser,
  type ProductRole,
  type SessionUserLike,
} from "@/config/productMode";

/** Routes restricted to platform super admins. */
const SUPER_ADMIN_ONLY_PREFIXES = ["/super-admin"] as const;

/** Operator / automation surfaces hidden from normal customers. */
const ADMIN_ROUTE_PREFIXES = [
  "/super-admin",
  "/automation",
  "/job-guru",
  "/system-status",
  "/demo",
  "/applications",
  "/contacts",
  "/interviews",
  "/insights",
  "/reports",
  "/users",
  "/profile",
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getDefaultAppPath(productRole: ProductRole): string {
  if (isSuperAdmin(productRole)) return "/super-admin";
  return "/today";
}

export function canAccessAdminRoute(user: SessionUserLike): boolean {
  return isSuperAdminUser(user);
}

export function canAccessRoute(pathname: string, productRole: ProductRole): boolean {
  if (SUPER_ADMIN_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return isSuperAdmin(productRole);
  }

  if (!isSuperAdmin(productRole) && ADMIN_ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return false;
  }

  return true;
}

/** @deprecated Route visibility is driven by `config/navigation.ts`. */
export function isNavItemVisible(): boolean {
  return true;
}

export function productRoleFromSessionUser(user: SessionUserLike): ProductRole {
  return getEffectiveUserRole(user);
}
