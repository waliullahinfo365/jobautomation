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
