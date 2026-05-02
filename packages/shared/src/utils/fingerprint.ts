import { createHash } from "node:crypto";

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

export function normalizeUrl(value?: string): string {
  if (!value) return "";
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function createJobFingerprint(input: {
  tenantId: string;
  company: string;
  position: string;
  jobUrl?: string;
}): string {
  const key = [
    normalizeText(input.tenantId),
    normalizeText(input.company),
    normalizeText(input.position),
    normalizeUrl(input.jobUrl),
  ].join("|");

  return createHash("sha256").update(key).digest("hex");
}
