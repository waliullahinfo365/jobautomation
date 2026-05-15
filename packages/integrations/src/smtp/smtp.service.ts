import { sendResendEmail, isResendConfigured } from "../email/resend.service";

export async function sendFollowUpReminder(input: {
  to: string;
  subject: string;
  bodyText: string;
  tenantId: string;
  applicationId: string;
}) {
  if (!isResendConfigured()) {
    return { success: false, provider: "none" as const, message: "Resend not configured." };
  }
  const result = await sendResendEmail({
    tenantId: input.tenantId,
    to: input.to,
    subject: input.subject,
    html: `<p>${input.bodyText.replace(/\n/g, "<br>")}</p>`,
    text: input.bodyText,
  });
  return {
    success: result.success,
    provider: result.provider,
    deliveryId: result.deliveryId,
    message: result.message,
  };
}

export async function sendApplicationNotification(input: {
  to: string;
  subject: string;
  bodyText: string;
  tenantId: string;
}) {
  if (!isResendConfigured()) {
    return { success: false, provider: "none" as const, message: "Resend not configured." };
  }
  const result = await sendResendEmail({
    tenantId: input.tenantId,
    to: input.to,
    subject: input.subject,
    html: `<p>${input.bodyText.replace(/\n/g, "<br>")}</p>`,
    text: input.bodyText,
  });
  return {
    success: result.success,
    provider: result.provider,
    deliveryId: result.deliveryId,
    message: result.message,
  };
}

export async function sendReportEmailViaResend(input: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  tenantId: string;
  reportType: "Daily Digest" | "Weekly Performance" | "PDF Export" | "Manual Report";
}) {
  const recipient = Array.isArray(input.to) ? input.to[0] : input.to;
  if (!recipient || !isResendConfigured()) {
    return { success: false, provider: "none" as const, message: "Resend not configured or no recipient." };
  }
  const result = await sendResendEmail({
    tenantId: input.tenantId,
    to: recipient,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  return {
    success: result.success,
    provider: result.provider,
    deliveryId: result.deliveryId,
    message: result.message,
  };
}
