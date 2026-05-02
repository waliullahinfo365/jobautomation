import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { ApiError } from "../utils/errors";

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const log = logger.child({
    requestId: req.requestId,
    tenantId: req.user?.tenantId ?? req.tenantId,
  });

  if (err instanceof ApiError) {
    log.warn({ err, code: err.code }, err.message);
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
        requestId: req.requestId,
      },
    });
  }

  const internal = err instanceof Error ? err : new Error(String(err));
  log.error({ err: internal, stack: internal.stack }, internal.message);

  const clientMessage =
    env.nodeEnv === "production" ? "An unexpected error occurred" : internal.message;

  return res.status(500).json({
    success: false,
    error: {
      message: clientMessage,
      code: "INTERNAL_ERROR",
      requestId: req.requestId,
    },
  });
}
