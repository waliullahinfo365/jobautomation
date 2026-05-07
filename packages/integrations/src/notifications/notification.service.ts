export type NotificationEvent =
  | "new-job-detected"
  | "duplicate-skipped"
  | "cover-letter-generated"
  | "folder-created"
  | "interview-scheduled"
  | "deadline-due"
  | "follow-up-due"
  | "offer-received"
  | "daily-digest"
  | "weekly-report";

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

export async function sendSlackNotification(input: {
  tenantId: string;
  message: string;
  event: NotificationEvent;
}) {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) {
    return { status: "Warning" as const, reason: "SLACK_WEBHOOK_URL not configured" };
  }
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: input.message }),
  });
  if (!response.ok) {
    return { status: "Warning" as const, reason: `Slack webhook failed (${response.status})` };
  }
  return { status: "Sent" as const };
}

export async function sendWhatsAppNotification(input: {
  tenantId: string;
  to: string;
  message: string;
  event: NotificationEvent;
}) {
  const apiUrl = process.env.WHATSAPP_API_URL?.trim();
  const token = process.env.WHATSAPP_API_TOKEN?.trim();
  const from = process.env.WHATSAPP_FROM_NUMBER?.trim();
  if (!apiUrl || !token || !from) {
    return { status: "Warning" as const, reason: "WhatsApp provider env is incomplete" };
  }
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      text: input.message,
    }),
  });
  if (!response.ok) {
    return { status: "Warning" as const, reason: `WhatsApp API failed (${response.status})` };
  }
  return { status: "Sent" as const };
}
