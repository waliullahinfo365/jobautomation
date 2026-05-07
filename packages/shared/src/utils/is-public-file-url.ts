/**
 * True when `url` is safe to open as a public document/file link in production UI.
 * Rejects stub hosts, localhost, and non-HTTPS URLs (except optional API download base).
 */
export function isPublicFileUrl(url: string | null | undefined, apiPublicBase?: string | null): boolean {
  if (url == null || typeof url !== "string") return false;
  const t = url.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower.includes("stub.local")) return false;
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return false;
  if (lower.startsWith("file:")) return false;
  if (!/^https:\/\//i.test(t)) return false;
  try {
    const u = new URL(t);
    const host = u.hostname.toLowerCase();
    if (host === "drive.google.com" || host.endsWith(".drive.google.com")) return true;
    if (host === "docs.google.com" || host.endsWith(".docs.google.com")) return true;
    if (apiPublicBase && /^https?:\/\//i.test(apiPublicBase)) {
      const base = apiPublicBase.replace(/\/$/, "");
      if (t.startsWith(`${base}/`)) return true;
    }
    return false;
  } catch {
    return false;
  }
}
