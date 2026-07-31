import { getDatabaseStatus } from "@jobflow/database";
import { AutomationLogModel, AutomationModuleModel, IntegrationConnectionModel } from "@jobflow/database/models";
import type { Request } from "express";
import { getCurrentPlan } from "../services/billing.service";
import { listIntegrations } from "../services/integration.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import { getApiQueueReport } from "../config/queue";
import { env } from "../config/env";
import { isShuttingDown } from "../shutdown";

type ServiceStatus = "healthy" | "warning" | "needs_attention" | "not_configured" | "offline" | "disabled";

interface ServiceCheck {
  label: string;
  status: ServiceStatus;
  detail?: string;
}

function integrationStatusToService(status: string): ServiceStatus {
  switch (status) {
    case "Connected": return "healthy";
    case "Needs Attention": return "needs_attention";
    case "Expired": return "warning";
    case "Disabled": return "disabled";
    default: return "not_configured";
  }
}

export const getSystemStatus = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const db = getDatabaseStatus();
  const queue = getApiQueueReport();
  const role = req.user?.role ?? "";

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const cutoff30m = new Date(Date.now() - 30 * 60 * 1000);

  const [billingPlan, integrations, automationModuleCount, failedLogs, failedLast24h, recentAnyLog] =
    await Promise.all([
      getCurrentPlan({ tenantId }),
      listIntegrations({ tenantId }),
      AutomationModuleModel.countDocuments({ tenantId }),
      AutomationLogModel.find({ tenantId, status: "Failed" }).sort({ createdAt: -1 }).limit(15).lean(),
      AutomationLogModel.countDocuments({ tenantId, status: "Failed", createdAt: { $gte: cutoff24h } }),
      AutomationLogModel.findOne({ tenantId }).sort({ createdAt: -1 }).select("createdAt status").lean(),
    ]);

  // ── Integration health summary (counts) ──────────────────────────────────
  const integrationHealth = { connected: 0, needsAttention: 0, notConnected: 0, expired: 0, disabled: 0 };
  for (const i of integrations) {
    switch (i.status) {
      case "Connected": integrationHealth.connected += 1; break;
      case "Needs Attention": integrationHealth.needsAttention += 1; break;
      case "Expired": integrationHealth.expired += 1; break;
      case "Disabled": integrationHealth.disabled += 1; break;
      default: integrationHealth.notConnected += 1;
    }
  }

  const byProvider = new Map(integrations.map((i) => [i.provider, i]));

  // ── Per-service named checks ─────────────────────────────────────────────
  const services: Record<string, ServiceCheck> = {};

  // API
  services.api = {
    label: "API server",
    status: isShuttingDown() ? "warning" : "healthy",
    detail: isShuttingDown() ? "Shutting down" : `${env.nodeEnv}`,
  };

  // Database
  const dbStatus: ServiceStatus =
    db.state === "connected" ? "healthy" : db.state === "connecting" ? "warning" : "offline";
  services.database = { label: "Database (MongoDB)", status: dbStatus, detail: db.state };

  // Queue / BullMQ
  const queueStatus: ServiceStatus =
    queue.mode === "bullmq" ? "healthy" : queue.mode === "memory" ? "warning" : "disabled";
  services.queue = {
    label: "Job queue",
    status: queueStatus,
    detail: queue.mode === "bullmq" ? "Redis / BullMQ" : queue.mode === "memory" ? "In-memory (non-durable)" : "Disabled",
  };

  // Worker heartbeat — inferred from most recent automation log
  if (!recentAnyLog) {
    services.worker = { label: "Automation workers", status: "not_configured", detail: "No logs yet — workers may not have run" };
  } else {
    const logAge = Date.now() - new Date((recentAnyLog as any).createdAt).getTime();
    const lastRunMin = Math.round(logAge / 60000);
    if (new Date((recentAnyLog as any).createdAt) >= cutoff30m) {
      services.worker = { label: "Automation workers", status: "healthy", detail: `Last activity ${lastRunMin}m ago` };
    } else {
      services.worker = { label: "Automation workers", status: "warning", detail: `Last activity ${lastRunMin}m ago — may be idle` };
    }
  }

  // Google Calendar (Drive/Gmail replaced by Firebase + Unipile — omitted from status)
  const calendar = byProvider.get("Google Calendar");
  services.googleCalendar = {
    label: "Google Calendar",
    status: integrationStatusToService(calendar?.status ?? "Not Connected"),
    detail: calendar?.connectedEmail ?? (calendar?.status === "Not Connected" ? "Not connected" : undefined),
  };

  // Anthropic / Claude AI
  const anthropicKeySet = Boolean(process.env.ANTHROPIC_API_KEY?.trim() || process.env.CLAUDE_API_KEY?.trim());
  const claudeRow = byProvider.get("Claude");
  const aiConnected = claudeRow?.status === "Connected";
  services.aiProvider = {
    label: "AI provider (Anthropic Claude)",
    status: aiConnected ? "healthy" : anthropicKeySet ? "healthy" : "not_configured",
    detail: aiConnected
      ? "Claude integration connected"
      : anthropicKeySet
        ? "API key set (not yet verified)"
        : "No AI provider configured — set ANTHROPIC_API_KEY or connect Claude under Integrations",
  };

  // Resend
  const resendKeySet = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
  const resendRow = byProvider.get("Resend");
  services.resend = {
    label: "Resend (email)",
    status: resendRow?.status === "Connected" ? "healthy" : resendKeySet ? "healthy" : "not_configured",
    detail: resendRow?.status === "Connected"
      ? "Connected"
      : resendKeySet
        ? "Env vars set"
        : "Set RESEND_API_KEY and RESEND_FROM_EMAIL to enable email delivery",
  };

  // Telegram
  const telegramKeySet = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
  const telegramRow = byProvider.get("Telegram");
  services.telegram = {
    label: "Telegram",
    status: telegramRow?.status === "Connected" ? "healthy" : telegramKeySet ? "healthy" : "not_configured",
    detail: telegramRow?.status === "Connected" || telegramKeySet
      ? "Configured"
      : "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable notifications",
  };

  // Slack
  const slackKeySet = Boolean(process.env.SLACK_WEBHOOK_URL?.trim());
  const slackRow = byProvider.get("Slack");
  services.slack = {
    label: "Slack",
    status: slackRow?.status === "Connected" ? "healthy" : slackKeySet ? "healthy" : "not_configured",
    detail: slackRow?.status === "Connected" || slackKeySet ? "Webhook configured" : "Set SLACK_WEBHOOK_URL to enable Slack alerts",
  };

  // ── Overall health ───────────────────────────────────────────────────────
  const statuses = Object.values(services).map((s) => s.status);
  const overallHealth: ServiceStatus =
    statuses.some((s) => s === "offline") ? "offline" :
    statuses.some((s) => s === "needs_attention") ? "needs_attention" :
    statuses.some((s) => s === "warning") || failedLast24h > 0 ? "warning" :
    "healthy";

  const recentFailedLogs = (failedLogs as any[]).map((l) => ({
    id: String(l._id),
    moduleKey: l.moduleKey,
    moduleName: l.moduleName,
    message: l.message,
    error: l.error,
    createdAt: l.createdAt,
  }));

  return successResponse(res, {
    overallHealth,
    api: { status: isShuttingDown() ? "shutting_down" : "ok", environment: env.nodeEnv },
    database: { state: db.state, host: db.host, name: db.name },
    queue,
    services,
    tenantId,
    currentUserRole: role,
    integrationHealth,
    billing: {
      planKey: billingPlan.planKey,
      displayName: billingPlan.displayName,
      billingStatus: billingPlan.billingStatus,
    },
    automation: { moduleCount: automationModuleCount },
    failedLogsLast24h: failedLast24h,
    recentFailedLogs,
  });
});
