import {
  isAdvancedUiEnabled,
  isSuperAdmin,
  normalizeProductRole,
  type ProductRole,
} from "@/config/productMode";

/** Routes restricted to platform super admins. */
const SUPER_ADMIN_PREFIXES = ["/super-admin"] as const;

/** Operator / automation surfaces hidden from normal customers. */
const ADVANCED_UI_PREFIXES = [
  "/automation",
  "/job-guru",
  "/system-status",
  "/demo",
  "/applications",
  "/contacts",
  "/interviews",
  "/insights",
  "/reports",
  "/profile",
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getDefaultAppPath(productRole: ProductRole): string {
  if (isSuperAdmin(productRole)) return "/super-admin";
  return "/today";
}

export function canAccessRoute(
  pathname: string,
  productRole: ProductRole,
  advancedUi = isAdvancedUiEnabled(productRole)
): boolean {
  if (SUPER_ADMIN_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return isSuperAdmin(productRole);
  }

  if (!advancedUi && ADVANCED_UI_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return false;
  }

  return true;
}

/** @deprecated Route visibility is driven by `config/navigation.ts`. */
export function isNavItemVisible(): boolean {
  return true;
}

export function productRoleFromSessionUser(user: {
  productRole?: string | null;
  role?: string;
  email?: string | null;
  preferences?: Record<string, unknown>;
}): ProductRole {
  return normalizeProductRole(user);
}
