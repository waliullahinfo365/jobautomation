export async function sendFollowUpReminderStub(input: {
  to: string;
  subject: string;
  bodyText: string;
  tenantId: string;
  applicationId: string;
}) {
  // TODO: Replace with real SMTP provider send call.
  return {
    deliveryId: `follow-up-${Date.now()}`,
    status: "sent" as const,
    recipient: input.to,
  };
}

export async function sendApplicationNotificationStub(input: {
  to: string;
  subject: string;
  bodyText: string;
  tenantId: string;
}) {
  // TODO: Replace with real SMTP provider send call.
  return {
    deliveryId: `notification-${Date.now()}`,
    status: "sent" as const,
    recipient: input.to,
  };
}

export async function sendReportEmailStub(input: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  reportType: "Daily Digest" | "Weekly Performance" | "PDF Export" | "Manual Report";
}) {
  const recipient = Array.isArray(input.to) ? input.to.join(",") : input.to;
  return {
    deliveryId: `report-${input.reportType.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    status: "Sent" as const,
    sentAt: new Date().toISOString(),
    recipient,
  };
}
