import type { SmtpOutboundCredentials } from "../smtp/mail";
import { sendSmtpMail } from "../smtp/mail";
import { isResendConfigured, sendResendEmail } from "./resend.service";

export { isResendConfigured } from "./resend.service";

export type SendReportEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  smtpOutbound?: SmtpOutboundCredentials | null;
};

export type SendReportEmailOutcome = {
  success: boolean;
  provider: "resend" | "smtp" | "none";
  message: string;
};

/**
 * Priority: Resend (env) → SMTP (tenant integration). No SMTP fallback if Resend is configured but fails.
 */
export async function sendReportEmail(params: SendReportEmailParams): Promise<SendReportEmailOutcome> {
  if (isResendConfigured()) {
    const r = await sendResendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (r.success) {
      return { success: true, provider: "resend", message: "Delivered via Resend." };
    }
    const safe = r.message.replace(/\b(sk|rsk)_[a-z0-9]+/gi, "[redacted]");
    return {
      success: false,
      provider: "resend",
      message: `Resend email failed: ${safe}`.slice(0, 320),
    };
  }

  if (params.smtpOutbound) {
    try {
      await sendSmtpMail({
        ...params.smtpOutbound,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      return { success: true, provider: "smtp", message: "Delivered via SMTP." };
    } catch (e) {
      return {
        success: false,
        provider: "smtp",
        message: e instanceof Error ? e.message.slice(0, 280) : "SMTP send failed.",
      };
    }
  }

  return { success: false, provider: "none", message: "Resend/SMTP not configured." };
}
