"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSystemStatus, type ServiceStatus, type SystemStatusResponse } from "@/lib/api/system.api";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { StatusIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { API_URL } from "@/config/env";

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ServiceStatus, { label: string; dot: string; badge: string }> = {
  healthy: {
    label: "system.statusHealthy",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  warning: {
    label: "system.statusWarning",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  needs_attention: {
    label: "system.statusNeedsAttention",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  not_configured: {
    label: "system.statusNotConfigured",
    dot: "bg-gray-300 dark:bg-gray-600",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  offline: {
    label: "system.statusOffline",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  disabled: {
    label: "system.statusDisabled",
    dot: "bg-gray-300 dark:bg-gray-600",
    badge: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  },
};

function StatusBadge({ status, t }: { status: ServiceStatus; t: (k: string) => string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_configured;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {t(cfg.label)}
    </span>
  );
}

function OverallBanner({ status, failedLast24h, t }: { status: ServiceStatus; failedLast24h: number; t: (k: string) => string }) {
  const isGood = status === "healthy";
  const isOffline = status === "offline";
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        isGood
          ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20"
          : isOffline
            ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
            : "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "h-3 w-3 rounded-full",
            isGood ? "bg-green-500" : isOffline ? "bg-red-500" : "bg-amber-400",
          )}
        />
        <span className="font-semibold text-sm text-[var(--text-1)]">
          {isGood ? t("system.allSystemsOperational") : t("system.systemNeedsAttention")}
        </span>
      </div>
      {failedLast24h > 0 && (
        <span className="text-xs text-[var(--text-3)]">
          {failedLast24h} {t("system.failuresLast24h")}
        </span>
      )}
    </div>
  );
}

function ServiceRow({ name, label, status, detail, t }: {
  name: string;
  label: string;
  status: ServiceStatus;
  detail?: string;
  t: (k: string) => string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text-1)] truncate">{label}</p>
        {detail && (
          <p className="mt-0.5 text-xs text-[var(--text-3)] truncate max-w-[260px]">{detail}</p>
        )}
      </div>
      <StatusBadge status={status} t={t} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SystemStatusClient() {
  const { t } = useTranslation();
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const [queueMode, setQueueMode] = useState<string | null>(null);

  const system = useApiQuery(() => getSystemStatus(), { enabled: true });
  const payload = system.data as SystemStatusResponse | undefined;

  // Fetch public /health for API reachability (no auth needed)
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
        const json = await res.json() as { queue?: { mode?: string } };
        setApiReachable(res.ok);
        setQueueMode(json?.queue?.mode ?? null);
      } catch {
        setApiReachable(false);
      }
    })();
  }, []);

  const services = payload?.services ?? {};
  const serviceKeys = [
    "api", "database", "queue", "worker",
    "gmail", "googleDrive", "googleCalendar",
    "aiProvider", "resend", "telegram", "slack",
  ];

  // Compute overall status locally from public /health if system endpoint not yet loaded
  const overallHealth: ServiceStatus = payload?.overallHealth ??
    (apiReachable === false ? "offline" : "not_configured");

  const failedLast24h = payload?.failedLogsLast24h ?? 0;
  const recentFailedLogs = payload?.recentFailedLogs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={StatusIcon}
        eyebrow={t("system.eyebrow")}
        title={t("system.title")}
        description={t("system.description")}
      />

      {/* Overall health banner */}
      {(payload || apiReachable === false) && (
        <OverallBanner status={overallHealth} failedLast24h={failedLast24h} t={t} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Services checklist */}
        <Card className="border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("system.servicesTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {system.loading && !payload ? (
              <p className="text-sm text-[var(--text-3)] py-4">{t("system.loadingHealth")}</p>
            ) : system.error && !payload ? (
              <p className="text-sm text-amber-700 py-2">{t("system.signInForFullStatus")}</p>
            ) : (
              <div>
                {/* API reachable row — from public /health */}
                <div className="flex items-center justify-between gap-3 py-2.5 border-b border-[var(--border)]">
                  <p className="text-sm font-medium text-[var(--text-1)]">{t("system.apiHealth")}</p>
                  <StatusBadge
                    status={apiReachable === null ? "not_configured" : apiReachable ? "healthy" : "offline"}
                    t={t}
                  />
                </div>
                {queueMode && (
                  <div className="flex items-center justify-between gap-3 py-2.5 border-b border-[var(--border)]">
                    <p className="text-sm font-medium text-[var(--text-1)]">{t("system.queueMode")}</p>
                    <StatusBadge
                      status={queueMode === "bullmq" ? "healthy" : queueMode === "memory" ? "warning" : "disabled"}
                      t={t}
                    />
                  </div>
                )}
                {serviceKeys.map((key) => {
                  const svc = services[key];
                  if (!svc) return null;
                  return (
                    <ServiceRow
                      key={key}
                      name={key}
                      label={svc.label}
                      status={svc.status}
                      detail={svc.detail}
                      t={t}
                    />
                  );
                })}
                {Object.keys(services).length === 0 && !system.loading && (
                  <p className="py-4 text-sm text-[var(--text-3)]">{t("system.signInForFullStatus")}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration summary + plan */}
        <div className="space-y-4">
          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t("system.integrationHealth")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {payload ? (
                <div className="space-y-2">
                  <IntegrationSummaryRow label={t("system.connected")} count={payload.integrationHealth.connected} variant="green" />
                  <IntegrationSummaryRow label={t("system.needsAttention")} count={payload.integrationHealth.needsAttention} variant="amber" />
                  <IntegrationSummaryRow label={t("system.notConnected")} count={payload.integrationHealth.notConnected} variant="gray" />
                  {payload.integrationHealth.expired > 0 && (
                    <IntegrationSummaryRow label={t("system.expired")} count={payload.integrationHealth.expired} variant="amber" />
                  )}
                  {payload.integrationHealth.disabled > 0 && (
                    <IntegrationSummaryRow label={t("system.disabledCount")} count={payload.integrationHealth.disabled} variant="gray" />
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-3)]">{t("system.noData")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t("system.accountInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 text-sm">
              {payload ? (
                <>
                  <InfoRow label={t("system.plan")} value={payload.billing.displayName} />
                  <InfoRow label={t("system.billingStatus")} value={payload.billing.billingStatus} />
                  <InfoRow label={t("system.role")} value={payload.currentUserRole || "—"} />
                  <InfoRow label={t("system.automationModules")} value={String(payload.automation.moduleCount)} />
                </>
              ) : (
                <p className="text-[var(--text-3)]">{t("system.noData")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent failed logs */}
      <Card className="border shadow-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">{t("system.recentFailedLogs")}</CardTitle>
            {failedLast24h > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {failedLast24h} {t("system.failuresLast24h")}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {recentFailedLogs.length === 0 ? (
            <p className="text-sm text-[var(--text-3)]">
              {system.loading ? t("system.loadingHealth") : t("system.noRecentFailures")}
            </p>
          ) : (
            <ul className="space-y-2">
              {recentFailedLogs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-900/40 dark:bg-red-950/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-red-900 dark:text-red-200">{log.moduleName}</span>
                    {log.createdAt && (
                      <span className="shrink-0 text-xs text-red-600/70 dark:text-red-400/70">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-red-800/80 dark:text-red-300/80">{log.message}</p>
                  {log.error && (
                    <p className="mt-1 font-mono text-[10px] text-red-700/70 dark:text-red-400/70 truncate">{log.error}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationSummaryRow({ label, count, variant }: { label: string; count: number; variant: "green" | "amber" | "gray" }) {
  const colors = {
    green: "text-green-700 dark:text-green-300",
    amber: "text-amber-700 dark:text-amber-300",
    gray: "text-[var(--text-3)]",
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-2)]">{label}</span>
      <span className={cn("font-semibold tabular-nums", colors[variant])}>{count}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--text-3)]">{label}</span>
      <span className="text-[var(--text-1)] font-medium text-right">{value}</span>
    </div>
  );
}
