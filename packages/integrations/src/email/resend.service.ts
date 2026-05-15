export type SendResendEmailInput = {
  tenantId?: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
};

export type SendResendEmailResult = {
  success: boolean;
  provider: "resend";
  deliveryId?: string;
  error?: string;
  message: string;
};

/** True when API env has both key and verified sender (never logs secrets). */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

function buildFromAddress(): string {
  const email = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  const name = process.env.RESEND_FROM_NAME?.trim();
  return name ? `${name} <${email}>` : email;
}

function isDomainVerificationError(status: number, message: string): boolean {
  if (status === 403) return true;
  const low = message.toLowerCase();
  return (
    low.includes("domain") && (low.includes("not verified") || low.includes("verify") || low.includes("unverified"))
  ) || low.includes("sending domain") || low.includes("sender not allowed");
}

/**
 * POST https://api.resend.com/emails
 * Returns a real deliveryId from Resend on success. Never fakes a delivery ID.
 * API key is never logged.
 */
export async function sendResendEmail(input: SendResendEmailInput): Promise<SendResendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = buildFromAddress();
  if (!apiKey || !from) {
    return { success: false, provider: "resend", message: "Resend not configured.", error: "RESEND_API_KEY or RESEND_FROM_EMAIL missing." };
  }

  const body: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
  };
  if (input.replyTo) body.reply_to = input.replyTo;
  if (input.attachments?.length) {
    body.attachments = input.attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content) ? a.content.toString("base64") : a.content,
      ...(a.contentType ? { content_type: a.contentType } : {}),
    }));
  }

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "newjobguru/1.0",
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : "Network error";
    return { success: false, provider: "resend", message: `Resend network error: ${msg.slice(0, 200)}`, error: "NETWORK_ERROR" };
  }

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const rawMsg =
      typeof json.message === "string"
        ? json.message
        : typeof json.name === "string"
          ? json.name
          : `HTTP ${res.status}`;
    const safe = rawMsg.replace(/\b(re_)[a-z0-9_-]{10,}/gi, "[redacted]");
    const truncated = safe.slice(0, 280);
    if (isDomainVerificationError(res.status, rawMsg)) {
      return {
        success: false,
        provider: "resend",
        message: "Resend domain is not verified. Verify your sending domain in Resend or use a verified sender.",
        error: "DOMAIN_NOT_VERIFIED",
      };
    }
    return { success: false, provider: "resend", message: truncated, error: `HTTP_${res.status}` };
  }

  const deliveryId = typeof json.id === "string" ? json.id : undefined;
  return { success: true, provider: "resend", deliveryId, message: "Sent" };
}
