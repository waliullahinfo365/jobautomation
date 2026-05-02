import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { IntegrationProvider } from "@jobflow/shared/types/integration";
import { env } from "../config/env";
import { ApiError } from "./errors";

const OAUTH_STATE_TYP = "google_oauth_state";
const EXPIRES_IN_SEC = 10 * 60;

export type GoogleOAuthStatePayload = {
  typ: typeof OAUTH_STATE_TYP;
  tenantId: string;
  userId: string;
  provider: IntegrationProvider;
  nonce: string;
  createdAt: number;
};

function getSigningSecret(): string {
  if (env.jwtSecret) return env.jwtSecret;
  if (env.nodeEnv !== "production") {
    console.warn("[oauth-state] JWT_SECRET missing — using insecure dev-only OAuth state signing");
    return "jobflow-oauth-state-dev-insecure";
  }
  throw new ApiError("OAuth state signing is not configured (JWT_SECRET)", 500, "CONFIG_ERROR");
}

export function createOAuthState(input: { tenantId: string; userId: string; provider: IntegrationProvider }): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload: GoogleOAuthStatePayload = {
    typ: OAUTH_STATE_TYP,
    tenantId: input.tenantId,
    userId: input.userId,
    provider: input.provider,
    nonce,
    createdAt: Date.now(),
  };
  return jwt.sign(payload, getSigningSecret(), { expiresIn: EXPIRES_IN_SEC });
}

export function verifyOAuthState(state: string): GoogleOAuthStatePayload {
  try {
    const decoded = jwt.verify(state, getSigningSecret());
    if (typeof decoded !== "object" || decoded === null) {
      throw new Error("Invalid state payload");
    }
    const d = decoded as Record<string, unknown>;
    if (d.typ !== OAUTH_STATE_TYP) throw new Error("Invalid state type");
    const tenantId = String(d.tenantId ?? "");
    const userId = String(d.userId ?? "");
    const provider = d.provider as IntegrationProvider;
    const nonce = String(d.nonce ?? "");
    const createdAt = Number(d.createdAt ?? 0);
    if (!tenantId || !userId || !provider || !nonce) {
      throw new Error("Incomplete state");
    }
    return {
      typ: OAUTH_STATE_TYP,
      tenantId,
      userId,
      provider,
      nonce,
      createdAt,
    };
  } catch (e) {
    throw new ApiError(e instanceof Error ? e.message : "Invalid OAuth state", 400, "OAUTH_STATE_INVALID");
  }
}
