import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: string;
  userId: string;
  tenantId: string;
  role: string;
  email: string;
};

export function signAccessToken(payload: Omit<AccessTokenPayload, "sub"> & { userId: string }): string {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const body: AccessTokenPayload = {
    sub: payload.userId,
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
    email: payload.email,
  };
  const options = { expiresIn: env.accessTokenExpiresIn } as SignOptions;
  return jwt.sign(body, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }
  const d = decoded as Record<string, unknown>;
  const userId = String(d.userId ?? d.sub ?? "");
  const tenantId = String(d.tenantId ?? "");
  const role = String(d.role ?? "");
  const email = String(d.email ?? "");
  if (!userId || !tenantId) {
    throw new Error("Invalid token claims");
  }
  return { sub: userId, userId, tenantId, role, email };
}
