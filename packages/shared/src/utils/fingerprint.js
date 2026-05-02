import { createHash } from "node:crypto";
export function normalizeText(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ");
}
export function normalizeUrl(value) {
    if (!value)
        return "";
    try {
        const url = new URL(value.trim());
        url.hash = "";
        url.search = "";
        return url.toString().replace(/\/$/, "").toLowerCase();
    }
    catch {
        return value.trim().toLowerCase();
    }
}
export function createJobFingerprint(input) {
    const key = [
        normalizeText(input.tenantId),
        normalizeText(input.company),
        normalizeText(input.position),
        normalizeUrl(input.jobUrl),
    ].join("|");
    return createHash("sha256").update(key).digest("hex");
}
