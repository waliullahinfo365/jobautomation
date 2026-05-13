import { AutomationLogModel } from "@jobflow/database/models";
import { notifications } from "@jobflow/integrations";

export async function notifyAutomationEvent(input: {
  tenantId: string;
  moduleKey: string;
  event: string;
  message: string;
  operationId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const result = await notifications.sendNotificationWithFallback({
      tenantId: input.tenantId,
      message: input.message,
      event: input.event as any,
    });
    if (result.status !== "Sent" || result.reason) {
      await AutomationLogModel.create({
        tenantId: input.tenantId,
        createdBy: "system",
        moduleKey: input.moduleKey,
        moduleName: input.moduleKey,
        status: "Warning",
        message: result.reason ?? "One or more notification providers did not deliver.",
        operationId: input.operationId,
        metadata: {
          ...(input.metadata ?? {}),
          notificationEvent: input.event,
          notificationProvider: result.provider,
          notificationStatus: result.status,
          notificationProviders: result.providers,
        },
      });
    }
  } catch (error) {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      createdBy: "system",
      moduleKey: input.moduleKey,
      moduleName: input.moduleKey,
      status: "Warning",
      message: `Telegram notification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      operationId: input.operationId,
      metadata: {
        ...(input.metadata ?? {}),
        notificationEvent: input.event,
        notificationProvider: "telegram",
        notificationStatus: "Failed",
      },
    });
  }
}
