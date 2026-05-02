export async function sendFollowUpReminderStub(input) {
    // TODO: Replace with real SMTP provider send call.
    return {
        deliveryId: `follow-up-${Date.now()}`,
        status: "sent",
        recipient: input.to,
    };
}
export async function sendApplicationNotificationStub(input) {
    // TODO: Replace with real SMTP provider send call.
    return {
        deliveryId: `notification-${Date.now()}`,
        status: "sent",
        recipient: input.to,
    };
}
export async function sendReportEmailStub(input) {
    const recipient = Array.isArray(input.to) ? input.to.join(",") : input.to;
    return {
        deliveryId: `report-${input.reportType.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        status: "Sent",
        sentAt: new Date().toISOString(),
        recipient,
    };
}
