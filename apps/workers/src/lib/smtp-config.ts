import { IntegrationConnectionModel } from "@jobflow/database/models";
import type { SmtpOutboundCredentials } from "@jobflow/integrations/smtp/mail";
import { decryptSecretForWorker } from "./google-auth";

/** Loads decrypted SMTP credentials for workers (same encrypted storage as API). */
export async function getSmtpOutboundCredentialsForWorker(tenantId: string): Promise<SmtpOutboundCredentials | null> {
  const conn = (await IntegrationConnectionModel.findOne({
    tenantId,
    provider: "SMTP",
    status: "Connected",
  }).lean()) as { accessTokenEncrypted?: string; metadata?: Record<string, unknown> } | null;
  if (!conn?.accessTokenEncrypted) return null;
  const meta = (conn.metadata ?? {}) as Record<string, unknown>;
  const host = typeof meta.host === "string" ? meta.host.trim() : "";
  const user = typeof meta.user === "string" ? meta.user.trim() : "";
  const from = typeof meta.from === "string" ? meta.from.trim() : "";
  if (!host || !user || !from) return null;

  let pass: string;
  try {
    pass = decryptSecretForWorker(conn.accessTokenEncrypted);
  } catch {
    return null;
  }

  const portRaw = meta.port;
  const port =
    typeof portRaw === "number" && Number.isFinite(portRaw)
      ? portRaw
      : typeof portRaw === "string"
        ? Number.parseInt(portRaw, 10)
        : 587;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: Boolean(meta.secure),
    user,
    pass,
    from,
    fromName: typeof meta.fromName === "string" && meta.fromName.trim() ? meta.fromName.trim() : undefined,
  };
}
