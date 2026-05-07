export type NotificationEvent =
  | "new-job-detected"
  | "duplicate-skipped"
  | "research-generated"
  | "cover-letter-generated"
  | "folder-created"
  | "interview-scheduled"
  | "deadline-due"
  | "follow-up-due"
  | "offer-received"
  | "daily-digest"
  | "weekly-report"
  | "automation-failure";

export type NotificationSendResult = {
  status: "Sent" | "Warning" | "Failed";
  provider: "telegram" | "slack" | "email" | "none";
  reason?: string;
};

export async function sendDashboardNotificationStub(input: {
  tenantId: string;
  title: string;
  message: string;
  severity?: "info" | "warning" | "error";
}) {
  return {
    notificationId: `dashboard-${Date.now()}`,
    status: "Sent" as const,
    deliveredAt: new Date().toISOString(),
    ...input,
  };
}

export async function sendSlackNotificationStub(input: {
  tenantId: string;
  channel?: string;
  message: string;
}) {
  return {
    notificationId: `slack-${Date.now()}`,
    status: "Sent" as const,
    deliveredAt: new Date().toISOString(),
    ...input,
  };
}

/** Post to Slack Incoming Webhook (URL from env). Never logs or returns the webhook URL. */
export async function postSlackIncomingWebhookMessage(message: string): Promise<
  | { ok: true }
  | { ok: false; kind: "missing_webhook" }
  | { ok: false; kind: "request_failed"; reason: string }
> {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) return { ok: false, kind: "missing_webhook" };
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    if (!response.ok) {
      return { ok: false, kind: "request_failed", reason: `Slack webhook failed (${response.status})` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      kind: "request_failed",
      reason: error instanceof Error ? error.message : "Slack webhook request failed",
    };
  }
}

export async function sendSlackNotification(input: {
  tenantId: string;
  message: string;
  event: NotificationEvent;
}) {
  const posted = await postSlackIncomingWebhookMessage(input.message);
  if (posted.ok) return { status: "Sent" as const };
  if (posted.kind === "missing_webhook") {
    return { status: "Warning" as const, reason: "Slack webhook is not configured." };
  }
  return { status: "Warning" as const, reason: posted.reason };
}

export async function sendTelegramNotification(input: {
  tenantId: string;
  message: string;
  event: NotificationEvent;
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!botToken || !chatId) {
    return { status: "Warning" as const, reason: "Telegram not configured." };
  }
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: input.message,
      parse_mode: "Markdown",
    }),
  });
  if (!response.ok) {
    return { status: "Failed" as const, reason: `Telegram API failed (${response.status})` };
  }
  return { status: "Sent" as const };
}

export async function sendNotificationWithFallback(input: {
  tenantId: string;
  message: string;
  event: NotificationEvent;
}): Promise<NotificationSendResult> {
  const telegram = await sendTelegramNotification(input);
  if (telegram.status === "Sent") return { status: "Sent", provider: "telegram" };

  const slack = await sendSlackNotification(input);
  if (slack.status === "Sent") return { status: "Sent", provider: "slack" };

  if (telegram.status === "Failed") {
    return { status: "Failed", provider: "telegram", reason: telegram.reason };
  }
  if (slack.status === "Warning") {
    return { status: "Warning", provider: "none", reason: "No notification provider configured." };
  }
  return { status: "Warning", provider: "none", reason: telegram.reason ?? "No notification provider configured." };
}
