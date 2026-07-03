import { getDefaultAppPath } from "@/lib/auth/routeAccess";
import { normalizeProductRole, type ProductRole } from "@/config/productMode";

export function getPostLoginPath(user: {
  productRole?: string | null;
  role?: string;
  preferences?: Record<string, unknown>;
}): string {
  const productRole: ProductRole = normalizeProductRole(user);
  return getDefaultAppPath(productRole);
}
