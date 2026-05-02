import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { errorResponse } from "../utils/apiResponse";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 20;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientKey(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  const raw = typeof fwd === "string" ? fwd.split(",")[0]?.trim() : "";
  return raw || req.ip || "unknown";
}

/** Rate limits sensitive auth endpoints (per IPv4/IPv6 client key). Test env skips limiting. */
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  if (env.nodeEnv === "test") return next();

  const key = clientKey(req);
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  if (b.count >= MAX_REQUESTS) {
    return errorResponse(res, "Too many requests. Try again later.", "RATE_LIMIT", 429);
  }
  b.count += 1;
  next();
}
