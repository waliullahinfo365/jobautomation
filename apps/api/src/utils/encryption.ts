import crypto from "crypto";
import { env } from "../config/env";
import { ApiError } from "./errors";

const DEV_PREFIX = "dev-insecure-plain:";
const ENC_PREFIX = "enc:v1:";

function keyBytes(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

/**
 * Encrypt a secret for at-rest storage.
 * - Production: requires `ENCRYPTION_KEY` (use KMS envelope encryption in a future iteration).
 * - Development: if missing, stores with `dev-insecure-plain:` prefix (logged warning).
 */
export function encryptSecret(value: string): string {
  if (env.nodeEnv === "production" && !process.env.ENCRYPTION_KEY?.trim()) {
    throw new ApiError("ENCRYPTION_KEY is required in production", 500, "CONFIG_ERROR");
  }
  const key = keyBytes();
  if (!key) {
    if (env.nodeEnv === "development") {
      console.warn("[encryption] ENCRYPTION_KEY missing — storing with dev-insecure prefix only");
      return `${DEV_PREFIX}${Buffer.from(value, "utf8").toString("base64url")}`;
    }
    throw new ApiError("ENCRYPTION_KEY is required", 500, "CONFIG_ERROR");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${Buffer.concat([iv, tag, enc]).toString("base64url")}`;
}

/**
 * Decrypt values produced by `encryptSecret`. Dev plain prefix round-trips without a key.
 */
export function decryptSecret(stored: string): string {
  if (stored.startsWith(DEV_PREFIX)) {
    return Buffer.from(stored.slice(DEV_PREFIX.length), "base64url").toString("utf8");
  }
  if (!stored.startsWith(ENC_PREFIX)) {
    throw new ApiError("Unknown ciphertext format", 400, "DECRYPT_ERROR");
  }
  const key = keyBytes();
  if (!key) {
    throw new ApiError("Cannot decrypt: ENCRYPTION_KEY not set", 500, "CONFIG_ERROR");
  }
  const raw = Buffer.from(stored.slice(ENC_PREFIX.length), "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
