import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { errorResponse } from "../utils/apiResponse";
import { isPublicApiPath } from "./public-paths";

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isPublicApiPath(req.path)) {
    return next();
  }

  const fromUser = req.user?.tenantId;
  if (fromUser) {
    req.tenantId = fromUser;
    return next();
  }

  if (env.nodeEnv !== "production") {
    const headerTenant = req.header("x-tenant-id");
    if (headerTenant) {
      req.tenantId = headerTenant;
      return next();
    }
  }

  return errorResponse(res, "Missing tenant context", "TENANT_REQUIRED", 400);
}
