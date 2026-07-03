"use client";

import Link from "next/link";
import {
  BotIcon,
  GaugeIcon,
  JobsIcon,
  RefreshIcon,
  SettingsIcon,
  StatusIcon,
  UserIcon,
} from "@/components/icons";
import { AlertTriangleIcon } from "@/components/icons/moreIcons";
import { AutomationLogsTable } from "@/components/automation/AutomationLogsTable";
import { AutomationStatusBadge } from "@/components/automation/AutomationStatusBadge";
import { ConnectionStatusBadge } from "@/components/settings/ConnectionStatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useSuperAdminDashboard, type SuperAdminKpis, type SuperAdminModuleSlot } from "@/hooks/useSuperAdminDashboard";
import { useTranslation } from "@/i18n/useTranslation";
import type { IntegrationListItem } from "@/types/integrations";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  accent?: "default" | "warning" | "success";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 shadow-sm",
        "border-[var(--border-default)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-4)]">{label}</p>
          <p
            className={cn(
              "mt-2 text-[32px] font-bold leading-none tracking-[-0.03em]",
              accent === "warning" ? "text-[var(--amber)]" : accent === "success" ? "text-[var(--emerald)]" : "text-[var(--text-1)]"
            )}
          >
            {value}
          </p>
          {hint ? <p className="mt-2 text-[12px] text-[var(--text-3)]">{hint}</p> : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent-hi)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatKpiValue(kpis: SuperAdminKpis, key: keyof SuperAdminKpis, t: (k: string) => string): string {
  if (key === "activeUsers") {
    return kpis.activeUsers === null ? "—" : String(kpis.activeUsers);
  }
  if (key === "aiCreditsUsed") {
    return kpis.aiCreditsUsed === null ? "—" : String(kpis.aiCreditsUsed);
  }
  if (key === "automationSuccessRate") {
    return `${kpis.automationSuccessRate}%`;
  }
  if (key === "activeUsersHint") {
    return t(`superAdmin.kpis.${kpis.activeUsersHint}`);
  }
  return String(kpis[key]);
}

function ModuleTile({ slot, t }: { slot: SuperAdminModuleSlot; t: (k: string) => string }) {
  const module = slot.module;
  const status = module?.status ?? slot.placeholderStatus;
  const successRate = module?.successRate ?? 0;
  const runs = module?.totalRuns ?? 0;

  return (
    <div className="flex min-h-[148px] flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--text-1)]">{t(slot.labelKey)}</h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--text-3)]">
            {module?.description || t(slot.placeholderDescriptionKey)}
          </p>
        </div>
        <AutomationStatusBadge status={status} />
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div className="text-[11px] text-[var(--text-4)]">
          <span className="block font-semibold text-[var(--text-2)]">{successRate}%</span>
          {t("superAdmin.modules.successRate")}
          <span className="mx-1">·</span>
          {runs} {t("superAdmin.modules.runs")}
        </div>
        <Link
          href="/automation"
          className="text-[12px] font-semibold text-[var(--accent-hi)] hover:underline"
        >
          {t("superAdmin.modules.manage")}
        </Link>
      </div>
    </div>
  );
}

function ConnectedAccountsPanel({
  integrations,
  health,
  t,
}: {
  integrations: IntegrationListItem[];
  health?: { connected: number; needsAttention: number; notConnected: number };
  t: (k: string) => string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-[var(--text-1)]">{t("superAdmin.connectedAccounts")}</h2>
        <Link href="/settings?section=Integrations" className="text-[12px] font-semibold text-[var(--accent-hi)] hover:underline">
          {t("superAdmin.viewAll")}
        </Link>
      </div>
      {health ? (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-[var(--emerald-bg)] px-2.5 py-1 font-medium text-[var(--emerald)]">
            {health.connected} {t("integrations.connected")}
          </span>
          <span className="rounded-full bg-[var(--amber-bg)] px-2.5 py-1 font-medium text-[var(--amber)]">
            {health.needsAttention} {t("integrations.needsAttention")}
          </span>
          <span className="rounded-full bg-[var(--surface-3)] px-2.5 py-1 font-medium text-[var(--text-3)]">
            {health.notConnected} {t("integrations.notConnected")}
          </span>
        </div>
      ) : null}
      <ul className="mt-4 space-y-2">
        {integrations.length === 0 ? (
          <li className="text-[13px] text-[var(--text-3)]">{t("superAdmin.noIntegrations")}</li>
        ) : (
          integrations.slice(0, 8).map((item) => (
            <li
              key={item.slug}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[var(--text-1)]">{item.provider}</p>
                <p className="truncate text-[11px] text-[var(--text-4)]">{item.connectedEmail ?? item.accountName ?? "—"}</p>
              </div>
              <ConnectionStatusBadge status={item.status} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function AlertsPanel({
  alerts,
  t,
}: {
  alerts: ReturnType<typeof useSuperAdminDashboard>["alerts"];
  t: (k: string) => string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 shadow-sm">
      <h2 className="text-[15px] font-semibold text-[var(--text-1)]">{t("superAdmin.systemAlerts")}</h2>
      {alerts.length === 0 ? (
        <p className="mt-3 text-[13px] text-[var(--text-3)]">{t("superAdmin.noAlerts")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                href={alert.href ?? "/system-status"}
                className={cn(
                  "block rounded-xl border px-3 py-3 transition-colors hover:bg-[var(--surface-2)]",
                  alert.severity === "critical"
                    ? "border-[var(--rose)]/30 bg-[var(--rose-bg)]/40"
                    : alert.severity === "warning"
                      ? "border-[var(--amber)]/30 bg-[var(--amber-bg)]/30"
                      : "border-[var(--border-subtle)] bg-[var(--surface-2)]"
                )}
              >
                <p className="text-[13px] font-semibold text-[var(--text-1)]">{t(alert.titleKey)}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--text-3)]">{alert.message}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const QUICK_ACTIONS = [
  { href: "/settings?section=Profile", labelKey: "superAdmin.actions.addUser", icon: UserIcon },
  { href: "/automation", labelKey: "superAdmin.actions.manageModules", icon: BotIcon },
  { href: "/system-status", labelKey: "superAdmin.actions.systemLogs", icon: StatusIcon },
  { href: "/settings?section=Integrations", labelKey: "superAdmin.actions.apiKeys", icon: SettingsIcon },
  { href: "/settings?section=Automation Rules", labelKey: "superAdmin.actions.automationRules", icon: GaugeIcon },
  { href: "/reports", labelKey: "superAdmin.actions.dataExport", icon: JobsIcon },
] as const;

export function SuperAdminDashboard() {
  const { t } = useTranslation();
  const data = useSuperAdminDashboard();

  if (data.loading && !data.system) {
    return <LoadingState title={t("superAdmin.loadingTitle")} description={t("superAdmin.loadingDesc")} />;
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 border-b border-[var(--border-default)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-hi)]">
            {t("superAdmin.eyebrow")}
          </p>
          <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[var(--text-1)] lg:text-[34px]">
            {t("superAdmin.dashboardTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-3)]">
            {t("superAdmin.dashboardDescription")}
          </p>
        </div>
        <Button type="button" variant="outline" className="min-h-[40px] shrink-0" onClick={() => void data.refetch()}>
          <RefreshIcon size={16} className="mr-2" />
          {t("superAdmin.refresh")}
        </Button>
      </header>

      {data.isUsingFallback ? (
        <ErrorState
          title={t("superAdmin.fallbackTitle")}
          description={t("superAdmin.fallbackDesc")}
          actionLabel={t("common.retry")}
          onAction={() => void data.refetch()}
          className="py-8"
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label={t("superAdmin.kpis.activeUsers")}
          value={formatKpiValue(data.kpis, "activeUsers", t)}
          hint={t(`superAdmin.kpis.${data.kpis.activeUsersHint}`)}
          icon={<UserIcon size={20} />}
        />
        <KpiCard
          label={t("superAdmin.kpis.jobsProcessedToday")}
          value={data.kpis.jobsProcessedToday}
          hint={t("superAdmin.kpis.jobsProcessedTodayHint")}
          icon={<JobsIcon size={20} />}
        />
        <KpiCard
          label={t("superAdmin.kpis.automationSuccessRate")}
          value={formatKpiValue(data.kpis, "automationSuccessRate", t)}
          hint={t("superAdmin.kpis.automationSuccessRateHint")}
          icon={<GaugeIcon size={20} />}
          accent="success"
        />
        <KpiCard
          label={t("superAdmin.kpis.aiCreditsUsed")}
          value={formatKpiValue(data.kpis, "aiCreditsUsed", t)}
          hint={t("superAdmin.kpis.aiCreditsUsedHint")}
          icon={<BotIcon size={20} />}
        />
        <KpiCard
          label={t("superAdmin.kpis.needsAttention")}
          value={data.kpis.needsAttention}
          hint={t("superAdmin.kpis.needsAttentionHint")}
          icon={<AlertTriangleIcon size={20} />}
          accent={data.kpis.needsAttention > 0 ? "warning" : "default"}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-[var(--text-1)]">{t("superAdmin.automationModules")}</h2>
          <Link href="/automation" className="text-[12px] font-semibold text-[var(--accent-hi)] hover:underline">
            {t("superAdmin.openAutomationCenter")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {data.moduleSlots.map((slot) => (
            <ModuleTile key={slot.slotId} slot={slot} t={t} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ConnectedAccountsPanel integrations={data.connectedIntegrations} health={data.integrationHealth} t={t} />
        <AlertsPanel alerts={data.alerts} t={t} />
      </div>

      <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-[var(--text-1)]">{t("superAdmin.recentActivity")}</h2>
          <Link href="/automation" className="text-[12px] font-semibold text-[var(--accent-hi)] hover:underline">
            {t("superAdmin.viewLogs")}
          </Link>
        </div>
        <AutomationLogsTable logs={data.recentLogs} />
      </section>

      <section className="space-y-3">
        <h2 className="text-[16px] font-semibold text-[var(--text-1)]">{t("superAdmin.quickActions")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.labelKey}
                href={action.href}
                className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-4 text-center transition-colors hover:border-[var(--accent-ring)] hover:bg-[var(--surface-2)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent-hi)]">
                  <Icon size={18} />
                </span>
                <span className="text-[12px] font-semibold leading-tight text-[var(--text-2)]">{t(action.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
