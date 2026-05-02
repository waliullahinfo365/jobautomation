import type { NextFunction, Request, Response } from "express";
import type { Permission } from "@jobflow/shared/constants/permissions";
import { ROLE_PERMISSIONS, roleHasPermission } from "@jobflow/shared/constants/permissions";
import type { TenantRole } from "@jobflow/shared/types/user";
import { errorResponse } from "../utils/apiResponse";

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!req.user?.id) {
      return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
    }
    if (!role || !roleHasPermission(role, permission)) {
      return errorResponse(res, "Insufficient permissions", "FORBIDDEN", 403);
    }
    next();
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!req.user?.id) {
      return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
    }
    if (!role) {
      return errorResponse(res, "Insufficient permissions", "FORBIDDEN", 403);
    }
    const ok = permissions.some((p) => roleHasPermission(role, p));
    if (!ok) {
      return errorResponse(res, "Insufficient permissions", "FORBIDDEN", 403);
    }
    next();
  };
}

export function requireRole(role: TenantRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
    }
    if (req.user.role !== role) {
      return errorResponse(res, "Insufficient permissions", "FORBIDDEN", 403);
    }
    next();
  };
}

/** Read-only helper for debugging RBAC maps */
export function listPermissionsForRole(role: TenantRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
