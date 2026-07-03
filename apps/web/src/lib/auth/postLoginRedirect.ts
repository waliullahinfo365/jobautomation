import { getDefaultAppPath } from "@/lib/auth/routeAccess";
import { getEffectiveUserRole, type ProductRole } from "@/config/productMode";

export function getPostLoginPath(user: {
  productRole?: string | null;
  role?: string;
  email?: string | null;
  preferences?: Record<string, unknown>;
}): string {
  const productRole: ProductRole = getEffectiveUserRole(user);
  return getDefaultAppPath(productRole);
}
