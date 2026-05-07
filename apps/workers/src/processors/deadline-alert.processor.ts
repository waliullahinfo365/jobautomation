import { notifyAutomationEvent } from "../lib/notifications";

export async function processDeadlineAlertJob(payload: {
  tenantId: string;
  operationId?: string;
  date?: string;
}) {
  const operationId = payload.operationId ?? `deadline-alert-${Date.now()}`;
  await notifyAutomationEvent({
    tenantId: payload.tenantId,
    moduleKey: "deadline-alert",
    event: "deadline-due",
    message: `⏳ Deadline alert sweep completed${payload.date ? ` for ${payload.date}` : ""}.`,
    operationId,
  });
  return { queued: true, moduleKey: "deadline-alert", operationId, payload };
}
