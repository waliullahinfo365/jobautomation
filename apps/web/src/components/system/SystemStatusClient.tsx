"use client";

import { MotionCard } from "@/components/shared/MotionCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL, AUTH_TOKEN_STORAGE_KEY, DEMO_TENANT_ID, DEMO_USER_ID, USE_MOCK_FALLBACK, env } from "@/config/env";
import { getSystemStatus, type SystemStatusResponse } from "@/lib/api/system.api";
import { useBillingApi } from "@/hooks/api/useBillingApi";
import { useAutomationApi } from "@/hooks/api/useAutomationApi";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import type { AutomationLog } from "@/types/automation";
import { cn } from "@/lib/utils";
import { ActivityIcon, LoaderIcon, ServerIcon, ShieldIcon, StatusIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { useEffect, useMemo, useState } from "react";

type HealthPayload = {
  success?: boolean;
  status?: string;
  database?: { status?: string };
  queue?: { mode?: string };
};

function tenantSource(t: (key: string) => string): string {
  if (typeof window === "undefined") return t("system.serverSource");
  try {
    const hasToken = Boolean(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
    if (hasToken) return t("system.bearerTokenSource");
    const storedTenantId = localStorage.getItem("tenantId");
    if (storedTenantId) return "localStorage.tenantId";
  } catch {
    /* ignore */
  }
  return t("system.demoHeadersSource");
}

function formatStatusValue(status: string | undefined, t: (key: string) => string) {
  if (!status) return "—";
  const normalized = status.toLowerCase();
  if (normalized === "healthy") return t("system.healthy");
  if (normalized === "operational") return t("system.operational");
  if (normalized === "degraded") return t("system.degraded");
  if (normalized === "offline") return t("system.offline");
  if (normalized === "online") return t("system.online");
  if (normalized === "ok") return t("system.ok");
  return status;
}

export function SystemStatusClient() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const system = useApiQuery(() => getSystemStatus(), { enabled: true });

  const billing = useBillingApi({ fallbackToMock: false });
  const automation = useAutomationApi({ fallbackToMock: false, params: { status: "Failed", limit: 20 } });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
        const json = (await res.json()) as HealthPayload;
        setHealth(json);
        setHealthError(null);
      } catch {
        setHealthError(t("system.couldNotReachHealth"));
      }
    })();
  }, [t]);

  const failedLogs = useMemo(() => {
    const fromSystem = system.data?.recentFailedLogs ?? [];
    if (fromSystem.length) return fromSystem;
    const logs = automation.listAutomationLogs as AutomationLog[] | undefined;
    return (logs ?? [])
      .filter((l) => l.status === "Failed")
      .slice(0, 12)
      .map((l) => ({
        id: l.id ?? l._id,
        moduleKey: l.moduleId ?? "—",
        moduleName: l.moduleName,
        message: l.message,
        error: undefined as string | undefined,
      }));
  }, [system.data, automation.listAutomationLogs]);

  const payload = system.data as SystemStatusResponse | undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={StatusIcon}
        eyebrow={t("system.eyebrow")}
        title={t("system.title")}
        description={t("system.description")}
        actions={
          <Badge variant="outline" className="gap-1">
            <ShieldIcon size={14} />
            {t("system.qaBadge")}
          </Badge>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <MotionCard>
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("system.apiHealth")}</CardTitle>
              <ServerIcon size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {healthError ? <p className="text-amber-600">{healthError}</p> : null}
              {health ? (
                <dl className="grid grid-cols-1 gap-1 text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <dt>{t("system.status")}</dt>
                    <dd className="font-medium text-foreground">{formatStatusValue(health.status, t)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>{t("system.database")}</dt>
                    <dd>{formatStatusValue(health.database?.status ?? payload?.database?.state, t)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>{t("system.queueMode")}</dt>
                    <dd>{health.queue?.mode ?? payload?.queue?.mode ?? "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <LoaderIcon size={16} /> {t("system.loadingHealth")}
                </p>
              )}
            </CardContent>
          </Card>
        </MotionCard>

        <MotionCard delay={0.05}>
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("system.protectedStatus")}</CardTitle>
              <ActivityIcon size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {system.loading ? (
                <LoaderIcon size={20} className="text-muted-foreground" />
              ) : system.error ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {system.error.message} — {t("system.signInForFullStatus")}
                </p>
              ) : payload ? (
                <dl className="grid gap-1 text-sm text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <dt>{t("system.tenant")}</dt>
                    <dd className="max-w-[60%] truncate font-mono text-xs text-foreground">{payload.tenantId}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>{t("system.role")}</dt>
                    <dd className="text-foreground">{payload.currentUserRole || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>{t("system.automationModules")}</dt>
                    <dd>{payload.automation.moduleCount}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>{t("system.plan")}</dt>
                    <dd className="text-right text-foreground">{payload.billing.displayName}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">{t("system.noData")}</p>
              )}
            </CardContent>
          </Card>
        </MotionCard>
      </div>

      <MotionCard delay={0.08}>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{t("system.frontendEnvironment")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 font-mono text-xs text-muted-foreground md:grid-cols-2">
            <div>
              <span className="text-foreground">{t("system.apiUrlLabel")}</span>
              <div className="break-all">{API_URL}</div>
            </div>
            <div>
              <span className="text-foreground">{t("system.mockFallbackLabel")}</span>
              <div>{USE_MOCK_FALLBACK ? t("system.enabled") : t("system.disabled")}</div>
            </div>
            <div>
              <span className="text-foreground">{t("system.demoTenantIdLabel")}</span>
              <div className="break-all">{DEMO_TENANT_ID}</div>
            </div>
            <div>
              <span className="text-foreground">{t("system.demoUserIdLabel")}</span>
              <div className="break-all">{DEMO_USER_ID}</div>
            </div>
            <div className="md:col-span-2">
              <span className="text-foreground">{t("system.tenantIdSourceLabel")}</span>
              <div>{tenantSource(t)}</div>
            </div>
            <div>
              <span className="text-foreground">{t("system.nodeEnvLabel")}</span>
              <div>{env.app.nodeEnv}</div>
            </div>
          </CardContent>
        </Card>
      </MotionCard>

      <MotionCard delay={0.1}>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{t("system.billingCard")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {billing.plan.loading ? (
              <LoaderIcon size={16} />
            ) : (
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs">
                {JSON.stringify(billing.plan.data ?? billing.usage.data ?? {}, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </MotionCard>

      <MotionCard delay={0.12}>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{t("system.integrationHealth")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {JSON.stringify(payload?.integrationHealth ?? { note: t("system.requiresSystemStatus") }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </MotionCard>

      <MotionCard delay={0.14}>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{t("system.recentFailedLogs")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {failedLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("system.noRecentFailures")}</p>
            ) : (
              <ul className="space-y-2">
                {failedLogs.map((log) => (
                  <li
                    key={log.id}
                    className={cn(
                      "rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm",
                      "text-red-900 dark:text-red-100"
                    )}
                  >
                    <div className="font-medium">{log.moduleName}</div>
                    <div className="text-xs opacity-90">{log.message}</div>
                    {log.error ? <div className="mt-1 font-mono text-[10px] opacity-80">{log.error}</div> : null}
                  </li>
                ))}
              </ul>
            )}
            {automation.isUsingFallback ? (
              <p className="text-xs text-muted-foreground">{t("system.showingMockLogs")}</p>
            ) : null}
          </CardContent>
        </Card>
      </MotionCard>
    </div>
  );
}
