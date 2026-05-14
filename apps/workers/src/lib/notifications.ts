import { AutomationLogModel, IntegrationConnectionModel } from "@jobflow/database/models";
import { notifications } from "@jobflow/integrations";

async function isTelegramDisabledForTenant(tenantId: string): Promise<boolean> {
  const row = await IntegrationConnectionModel.findOne({ tenantId, provider: "Telegram" }).lean();
  if (!row) return false;
  return (row as Record<string, unknown>).status === "Disabled";
}

async function isSlackDisabledForTenant(tenantId: string): Promise<boolean> {
  const row = await IntegrationConnectionModel.findOne({ tenantId, provider: "Slack" }).lean();
  if (!row) return false;
  return (row as Record<string, unknown>).status === "Disabled";
}

export async function notifyAutomationEvent(input: {
  tenantId: string;
  moduleKey: string;
  event: string;
  message: string;
  operationId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const [telegramDisabled, slackDisabled] = await Promise.all([
      isTelegramDisabledForTenant(input.tenantId),
      isSlackDisabledForTenant(input.tenantId),
    ]);

    if (telegramDisabled && slackDisabled) {
      return;
    }

    const result = await notifications.sendNotificationWithFallback({
      tenantId: input.tenantId,
      message: input.message,
      event: input.event as any,
      skipTelegram: telegramDisabled,
      skipSlack: slackDisabled,
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
      message: `Notification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      operationId: input.operationId,
      metadata: {
        ...(input.metadata ?? {}),
        notificationEvent: input.event,
        notificationStatus: "Failed",
      },
    });
  }
}
