import { isPublicFileUrl } from "@jobflow/shared/utils/is-public-file-url";

function apiPublicBase(): string | undefined {
  const u = process.env.API_PUBLIC_URL ?? process.env.RAILWAY_PUBLIC_DOMAIN;
  if (typeof u === "string" && u.trim()) {
    const t = u.trim();
    return t.startsWith("http") ? t : `https://${t}`;
  }
  return undefined;
}

/** Strips non-public `pdfUrl` / `storageUrl` (e.g. drive.stub.local) from API JSON. */
export function sanitizeDocumentForApi(doc: unknown): unknown {
  if (!doc || typeof doc !== "object") return doc;
  const o = { ...(doc as Record<string, unknown>) };
  const base = apiPublicBase();
  if (typeof o.pdfUrl === "string" && !isPublicFileUrl(o.pdfUrl, base)) {
    delete o.pdfUrl;
  }
  if (typeof o.storageUrl === "string" && !isPublicFileUrl(o.storageUrl, base)) {
    delete o.storageUrl;
  }
  return o;
}
