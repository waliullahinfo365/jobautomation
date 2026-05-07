import { notifyAutomationEvent } from "../lib/notifications";

export async function processLifecycleMonitoringJob(payload: {
  tenantId: string;
  operationId?: string;
  date?: string;
}) {
  const operationId = payload.operationId ?? `lifecycle-monitoring-${Date.now()}`;
  await notifyAutomationEvent({
    tenantId: payload.tenantId,
    moduleKey: "lifecycle-monitoring",
    event: "daily-digest",
    message: "📊 Lifecycle monitoring sweep completed.",
    operationId,
  });
  return { queued: true, moduleKey: "lifecycle-monitoring", operationId, payload };
}
