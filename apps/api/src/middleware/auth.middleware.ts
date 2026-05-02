import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { errorResponse } from "../utils/apiResponse";
import { verifyAccessToken } from "../utils/jwt";
import { isPublicApiPath } from "./public-paths";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isPublicApiPath(req.path)) {
    return next();
  }

  const authHeader = req.header("authorization");
  const bearer = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : undefined;

  if (bearer) {
    try {
      const payload = verifyAccessToken(bearer);
      req.user = {
        id: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        email: payload.email,
      };
      return next();
    } catch {
      return errorResponse(res, "Invalid or expired token", "INVALID_TOKEN", 401);
    }
  }

  if (env.nodeEnv !== "production" && env.allowDevAuthHeaders) {
    const userId = req.header("x-user-id");
    const tenantId = req.header("x-tenant-id");
    const role = req.header("x-user-role") ?? "Owner";
    if (userId && tenantId) {
      req.user = { id: userId, tenantId, role, email: "" };
      return next();
    }
    req.user = {
      id: env.demoUserId,
      tenantId: env.demoTenantId,
      role: "Owner",
      email: "",
    };
    return next();
  }

  if (env.nodeEnv !== "production" && !env.allowDevAuthHeaders) {
    return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
  }

  return errorResponse(res, "Authentication required", "UNAUTHORIZED", 401);
}
