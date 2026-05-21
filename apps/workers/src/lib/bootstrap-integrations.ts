/**
 * Auto-connect integrations that are configured via env vars (Telegram, Slack)
 * so tenants never need to click "Enable" manually in the UI.
 *
 * Runs once on worker startup. Safe to run multiple times — uses upsert and
 * never overwrites a tenant-set "Disabled" status (user explicitly turned it off).
 */
import { TenantModel, IntegrationConnectionModel } from "@jobflow/database/models";
import { logger } from "../utils/logger";

async function activeTenantIds(): Promise<string[]> {
  const tenants = await TenantModel.find({ status: { $in: ["Active", "Trialing"] } }).select("_id");
  return tenants.map((t) => String(t._id));
}

async function bootstrapTelegram(tenantIds: string[]): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!botToken || !chatId) return; // not configured — nothing to do

  for (const tenantId of tenantIds) {
    try {
      const existing = await IntegrationConnectionModel.findOne({
        tenantId,
        provider: "Telegram",
      }).lean() as Record<string, unknown> | null;

      // Never override an explicitly disabled connection
      if (existing?.status === "Disabled") continue;

      await IntegrationConnectionModel.findOneAndUpdate(
        { tenantId, provider: "Telegram" },
        {
          $set: {
            tenantId,
            provider: "Telegram",
            status: "Connected",
            syncStatus: "Connected",
            lastSyncAt: new Date(),
            metadata: {
              botTokenConfigured: true,
              chatIdConfigured: true,
              autoConnectedAt: new Date().toISOString(),
            },
          },
          $setOnInsert: { createdBy: "system" },
        },
        { upsert: true }
      );
    } catch (e) {
      logger.warn({ tenantId, err: e }, "bootstrap-integrations: failed to upsert Telegram for tenant");
    }
  }
}

async function bootstrapSlack(tenantIds: string[]): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  for (const tenantId of tenantIds) {
    try {
      const existing = await IntegrationConnectionModel.findOne({
        tenantId,
        provider: "Slack",
      }).lean() as Record<string, unknown> | null;

      if (existing?.status === "Disabled") continue;

      await IntegrationConnectionModel.findOneAndUpdate(
        { tenantId, provider: "Slack" },
        {
          $set: {
            tenantId,
            provider: "Slack",
            status: "Connected",
            syncStatus: "Connected",
            lastSyncAt: new Date(),
            metadata: {
              webhookConfigured: true,
              autoConnectedAt: new Date().toISOString(),
            },
          },
          $setOnInsert: { createdBy: "system" },
        },
        { upsert: true }
      );
    } catch (e) {
      logger.warn({ tenantId, err: e }, "bootstrap-integrations: failed to upsert Slack for tenant");
    }
  }
}

export async function bootstrapEnvIntegrations(): Promise<void> {
  const tenantIds = await activeTenantIds();
  await Promise.all([
    bootstrapTelegram(tenantIds),
    bootstrapSlack(tenantIds),
  ]);
  logger.info({ tenantCount: tenantIds.length }, "bootstrap-integrations: done");
}
