import { sendReportEmailStub } from "../smtp/smtp.service";
import { sendSlackNotification, sendTelegramNotification } from "./notification.service";
import type { NotificationEvent } from "./notification.service";

export type ProviderDeliveryMeta = {
  attempted: boolean;
  configured: boolean;
  success: boolean;
  message?: string;
};

function telegramEnvConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
}

function slackEnvConfigured(): boolean {
  return Boolean(process.env.SLACK_WEBHOOK_URL?.trim());
}

export type DeliverReportNotificationsInput = {
  tenantId: string;
  title: string;
  summaryText: string;
  detailUrl?: string;
  reportType: "Daily Digest" | "Weekly Performance" | "PDF Export" | "Manual Report";
  event: NotificationEvent;
  email?: { to: string; html: string; text: string };
  /** Tenant has SMTP integration marked Connected (actual send may still be stub). */
  smtpIntegrationConnected: boolean;
};

export type DeliverReportNotificationsResult = {
  telegram: ProviderDeliveryMeta;
  slack: ProviderDeliveryMeta;
  email: ProviderDeliveryMeta;
  anySent: boolean;
};

/**
 * Telegram first for user alerts; Slack optional team copy; SMTP optional when integration connected.
 * Generation must not throw when delivery fails — callers log warnings separately.
 */
export async function deliverReportNotifications(input: DeliverReportNotificationsInput): Promise<DeliverReportNotificationsResult> {
  const excerpt = input.summaryText.trim().slice(0, 1400);
  const message = [input.title, "", excerpt, input.detailUrl ? `\n\nOpen: ${input.detailUrl}` : ""].filter(Boolean).join("\n");

  const telegram: ProviderDeliveryMeta = {
    attempted: false,
    configured: telegramEnvConfigured(),
    success: false,
  };
  if (telegram.configured) {
    telegram.attempted = true;
    const r = await sendTelegramNotification({
      tenantId: input.tenantId,
      message,
      event: input.event,
      plainText: true,
    });
    if (r.status === "Sent") {
      telegram.success = true;
      telegram.message = "Delivered via Telegram.";
    } else {
      telegram.message = r.reason ?? "Telegram send did not complete.";
    }
  } else {
    telegram.message = "Telegram not configured.";
  }

  const slack: ProviderDeliveryMeta = {
    attempted: false,
    configured: slackEnvConfigured(),
    success: false,
  };
  if (slack.configured) {
    slack.attempted = true;
    const r = await sendSlackNotification({
      tenantId: input.tenantId,
      message,
      event: input.event,
    });
    if (r.status === "Sent") {
      slack.success = true;
      slack.message = "Posted to Slack webhook.";
    } else {
      slack.message = r.reason ?? "Slack send did not complete.";
    }
  } else {
    slack.message = "Slack webhook not configured.";
  }

  const email: ProviderDeliveryMeta = {
    attempted: false,
    configured: input.smtpIntegrationConnected,
    success: false,
  };
  if (input.smtpIntegrationConnected && input.email?.to) {
    email.attempted = true;
    try {
      await sendReportEmailStub({
        to: input.email.to,
        subject: input.title,
        html: input.email.html,
        text: input.email.text,
        reportType: input.reportType,
      });
      email.success = true;
      email.message = "SMTP integration connected; delivery simulated via stub until live SMTP send ships.";
    } catch (e) {
      email.message = e instanceof Error ? e.message : "Email send failed.";
    }
  } else if (!input.smtpIntegrationConnected) {
    email.message = "SMTP integration not connected.";
  }

  const anySent = telegram.success || slack.success || email.success;

  return { telegram, slack, email, anySent };
}
