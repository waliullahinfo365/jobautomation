import type { SmtpOutboundCredentials } from "../smtp/mail";
import { sendReportEmail, type SendReportEmailOutcome } from "./send-report-email";

/**
 * Unified outbound email entry point for workers/API.
 * Priority: Resend when `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set; otherwise tenant SMTP when provided.
 */
export async function sendEmail(input: {
  to: string;
  /** Ignored for Resend (uses `RESEND_FROM_EMAIL`); reserved for future SMTP overrides. */
  from?: string;
  subject: string;
  text: string;
  html: string;
  smtpOutbound?: SmtpOutboundCredentials | null;
}): Promise<SendReportEmailOutcome> {
  return sendReportEmail({
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    smtpOutbound: input.smtpOutbound,
  });
}
