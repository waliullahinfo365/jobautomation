import { notifyAutomationEvent } from "../lib/notifications";

export async function processOfferTrackingJob(payload: {
  tenantId: string;
  operationId?: string;
  date?: string;
}) {
  const operationId = payload.operationId ?? `offer-tracking-${Date.now()}`;
  await notifyAutomationEvent({
    tenantId: payload.tenantId,
    moduleKey: "offer-tracking",
    event: "offer-received",
    message: "💼 Offer tracking sweep completed.",
    operationId,
  });
  return { queued: true, moduleKey: "offer-tracking", operationId, payload };
}
