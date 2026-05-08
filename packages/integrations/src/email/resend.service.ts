export type SendResendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResendEmailResult = {
  success: boolean;
  provider: "resend";
  id?: string;
  message: string;
};

/** True when API env has both key and verified sender (never logs secrets). */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

/**
 * POST https://api.resend.com/emails — API key must never be logged.
 */
export async function sendResendEmail(input: SendResendEmailInput): Promise<SendResendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return { success: false, provider: "resend", message: "Resend not configured." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "jobflow-ai/1.0",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof json.message === "string"
        ? json.message
        : typeof json.name === "string"
          ? json.name
          : `HTTP ${res.status}`;
    return { success: false, provider: "resend", message: msg.slice(0, 280) };
  }

  const id = typeof json.id === "string" ? json.id : undefined;
  return { success: true, provider: "resend", id, message: "Sent" };
}
