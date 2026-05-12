"use client";

import type { BillingPlanResponse } from "@/lib/api/billing.api";
import { SettingSectionCard } from "./SettingSectionCard";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { useTranslation } from "@/i18n/useTranslation";

type BillingSectionProps = {
  billing: BillingPlanResponse | Record<string, unknown>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onChangePlan?: (planKey: string) => void;
  onCheckout?: (planKey: string) => void;
  usingMock?: boolean;
};

export function BillingSection({ billing, loading, error, onRetry, onChangePlan, onCheckout, usingMock }: BillingSectionProps) {
  const { t } = useTranslation();

  if (loading) {
    return <LoadingState title={t("settings.billing.loadingTitle")} description={t("settings.billing.loadingDescription")} />;
  }
  if (error) {
    return <ErrorState title={t("settings.billing.unavailable")} message={error} actionLabel={t("settings.billing.retry")} onAction={onRetry} />;
  }

  const snapshot = billing as BillingPlanResponse;
  const currentPlan = snapshot?.currentPlan?.displayName ?? String((billing as any)?.currentPlan ?? t("settings.billing.unknown"));
  const usage = snapshot?.usage ?? {};
  const limits = snapshot?.limits ?? {};
  const availablePlans = snapshot?.availablePlans ?? [];
  const billingStatus = formatBillingStatus(snapshot?.billingStatus, t);
  const billingStatusLine =
    snapshot?.billingStatus === "Active"
      ? t("settings.billing.statusActive")
      : `${t("settings.billing.statusLabel")}: ${billingStatus}`;

  return (
    <SettingSectionCard title={t("settings.billing.title")} description={t("settings.billing.description")}>
      <div className="mb-4 flex items-center justify-between">
        <ApiStatusIndicator
          usingMock={usingMock}
          labels={{
            connected: t("settings.billing.apiConnected"),
            mock: t("settings.billing.usingMockData"),
            offline: t("settings.billing.apiOffline"),
          }}
        />
        <span className="text-xs text-[var(--text-3)]">
          {billingStatusLine}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <Field label={t("settings.billing.currentPlan")} value={currentPlan} />
        <Field label={t("settings.billing.jobs")} value={`${usage.jobsCount ?? 0} / ${limits.maxJobs ?? "-"}`} />
        <Field label={t("settings.billing.automationRuns")} value={`${usage.automationRunsThisMonth ?? 0} / ${limits.maxAutomationRuns ?? "-"}`} />
        <Field label={t("settings.billing.aiCredits")} value={`${usage.aiCreditsUsedThisMonth ?? 0} / ${limits.maxAiCredits ?? "-"}`} />
        <Field label={t("settings.billing.storageUsage")} value={`${usage.storageUsedMb ?? 0} / ${limits.maxStorageMb ?? "-"} MB`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onChangePlan?.("starter")}>
          {t("settings.billing.changeToStarter")}
        </Button>
        <Button onClick={() => onCheckout?.("pro")}>{t("settings.billing.openCheckoutPro")}</Button>
      </div>
      {availablePlans.length > 0 ? (
        <div className="mt-4 rounded-md border p-3">
          <p className="mb-2 text-xs font-medium text-[var(--text-2)]">{t("settings.billing.availablePlans")}</p>
          <div className="grid gap-1 text-xs text-[var(--text-2)]">
            {availablePlans.map((plan) => (
              <p key={plan.planKey}>
                {formatPlanLine(plan, t)}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {usingMock ? (
        <p className="mt-3 text-xs text-amber-600">{t("settings.billing.mockFallback")}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs text-rose-600">{error}</p>
      ) : null}
      <div className="mt-2">
        <Button variant="ghost" size="sm" onClick={onRetry}>
          {t("settings.billing.refresh")}
        </Button>
      </div>
    </SettingSectionCard>
  );
}

function formatBillingStatus(status: string | undefined, t: (key: string) => string) {
  if (status === "Active") return t("settings.billing.active");
  if (status === "Trialing") return t("settings.billing.trialing");
  if (status === "Past Due") return t("settings.billing.pastDue");
  if (status === "Cancelled") return t("settings.billing.cancelled");
  return status ?? t("settings.billing.unknown");
}

function formatPlanLine(
  plan: BillingPlanResponse["availablePlans"][number],
  t: (key: string) => string
) {
  const keyByPlan: Record<string, string> = {
    free_trial: "settings.billing.freeTrialPlan",
    starter: "settings.billing.starterPlan",
    pro: "settings.billing.proPlan",
    agency: "settings.billing.agencyPlan",
    enterprise: "settings.billing.enterprisePlan",
  };
  const key = keyByPlan[plan.planKey];
  if (key) return t(key);
  return `${plan.displayName} - ${plan.currency} ${plan.priceMonthly}${t("settings.billing.perMonthSuffix")}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="text-[var(--text-2)]">{value}</p>
    </div>
  );
}
