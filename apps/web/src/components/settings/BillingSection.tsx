"use client";

import type { BillingPlanResponse, AvailablePlan } from "@/lib/api/billing.api";
import { SettingSectionCard } from "./SettingSectionCard";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useTranslation } from "@/i18n/useTranslation";

type BillingSectionProps = {
  billing: BillingPlanResponse | Record<string, unknown>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCheckout?: (planKey: string, billingCycle: "monthly" | "yearly") => void;
  onOpenPortal?: () => void;
  onCancelSubscription?: () => void;
};

export function BillingSection({
  billing,
  loading,
  error,
  onRetry,
  onCheckout,
  onOpenPortal,
}: BillingSectionProps) {
  const { t } = useTranslation();

  if (loading) {
    return <LoadingState title={t("settings.billing.loadingTitle")} description={t("settings.billing.loadingDescription")} />;
  }
  if (error) {
    return <ErrorState title={t("settings.billing.unavailable")} message={error} actionLabel={t("settings.billing.retry")} onAction={onRetry} />;
  }

  const snapshot = billing as BillingPlanResponse;
  const stripeConfigured = snapshot?.stripeConfigured ?? false;
  const billingNotice = snapshot?.billingNotice ?? null;
  const currentPlan = snapshot?.currentPlan;
  const currentPlanKey = currentPlan?.planKey ?? "free_trial";
  const billingStatus = snapshot?.billingStatus ?? "Trialing";
  const usage = snapshot?.usage ?? {};
  const limits = snapshot?.limits ?? {};
  const usagePercentages = snapshot?.usagePercentages ?? {};
  const availablePlans = (snapshot?.availablePlans ?? []).filter((p) => p.planKey !== "free_trial");
  const hasActiveSubscription = Boolean(currentPlan?.stripeSubscriptionId) && billingStatus === "Active";
  const cancelAtPeriodEnd = currentPlan?.cancelAtPeriodEnd ?? false;
  const periodEnd = currentPlan?.currentPeriodEnd
    ? new Date(currentPlan.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <SettingSectionCard title={t("settings.billing.title")} description={t("settings.billing.description")}>
      {/* Not configured notice */}
      {!stripeConfigured && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">{t("settings.billing.notConfiguredTitle")}</p>
          <p className="mt-0.5 text-xs text-amber-700">{billingNotice ?? t("settings.billing.notConfiguredDescription")}</p>
        </div>
      )}

      {/* Current plan summary */}
      <div className="mb-4 rounded-md border bg-[var(--surface-2)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--text-3)]">{t("settings.billing.currentPlan")}</p>
            <p className="text-base font-semibold text-[var(--text-1)]">{currentPlan?.displayName ?? t("settings.billing.unknown")}</p>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">
              <BillingStatusBadge status={billingStatus} />
              {cancelAtPeriodEnd && periodEnd ? ` · ${t("settings.billing.cancelsOn")} ${periodEnd}` : ""}
            </p>
          </div>
          {stripeConfigured && hasActiveSubscription && (
            <Button variant="outline" size="sm" onClick={onOpenPortal}>
              {t("settings.billing.manageBilling")}
            </Button>
          )}
        </div>
      </div>

      {/* Usage meters */}
      <div className="mb-4 space-y-3">
        <p className="text-xs font-medium text-[var(--text-2)]">{t("settings.billing.usageTitle")}</p>
        <UsageMeter
          label={t("settings.billing.jobs")}
          used={usage.jobsCount ?? 0}
          limit={limits.maxJobs}
          info={usagePercentages.maxJobs}
        />
        <UsageMeter
          label={t("settings.billing.automationRuns")}
          used={usage.automationRunsThisMonth ?? 0}
          limit={limits.maxAutomationRuns}
          info={usagePercentages.maxAutomationRuns}
        />
        <UsageMeter
          label={t("settings.billing.aiCredits")}
          used={usage.aiCreditsUsedThisMonth ?? 0}
          limit={limits.maxAiCredits}
          info={usagePercentages.maxAiCredits}
        />
        <UsageMeter
          label={t("settings.billing.storageUsage")}
          used={usage.storageUsedMb ?? 0}
          limit={limits.maxStorageMb}
          info={usagePercentages.maxStorageMb}
          suffix="MB"
        />
      </div>

      {/* Available plan upgrades */}
      {availablePlans.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-[var(--text-2)]">{t("settings.billing.availablePlans")}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => (
              <PlanCard
                key={plan.planKey}
                plan={plan}
                isCurrent={plan.planKey === currentPlanKey}
                stripeConfigured={stripeConfigured}
                onCheckout={onCheckout}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={onRetry}>
          {t("settings.billing.refresh")}
        </Button>
      </div>
    </SettingSectionCard>
  );
}

function BillingStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: "text-green-600",
    Trialing: "text-blue-600",
    "Past Due": "text-amber-600",
    Cancelled: "text-rose-600",
    Suspended: "text-rose-600",
  };
  return <span className={colors[status] ?? "text-[var(--text-3)]"}>{status}</span>;
}

function UsageMeter({
  label,
  used,
  limit,
  info,
  suffix,
}: {
  label: string;
  used: number;
  limit: number | string | undefined;
  info?: { current: number; limit: number | string; percent: number | null };
  suffix?: string;
}) {
  const isUnlimited = limit === "unlimited" || limit === "custom" || info?.limit === "unlimited";
  const percent = info?.percent ?? null;
  const barColor = percent === null ? "bg-blue-500" : percent >= 90 ? "bg-rose-500" : percent >= 70 ? "bg-amber-500" : "bg-blue-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-3)]">
        <span>{label}</span>
        <span>
          {used}{suffix ? ` ${suffix}` : ""} / {isUnlimited ? "∞" : `${limit ?? "—"}${suffix ? ` ${suffix}` : ""}`}
        </span>
      </div>
      {!isUnlimited && percent !== null ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, percent)}%` }} />
        </div>
      ) : (
        <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)]" />
      )}
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  stripeConfigured,
  onCheckout,
}: {
  plan: AvailablePlan;
  isCurrent: boolean;
  stripeConfigured: boolean;
  onCheckout?: (planKey: string, billingCycle: "monthly" | "yearly") => void;
}) {
  return (
    <div className={`rounded-md border p-3 text-xs ${isCurrent ? "border-blue-400 bg-blue-50" : "border-[var(--border)] bg-[var(--surface-2)]"}`}>
      <p className="font-semibold text-[var(--text-1)]">{plan.displayName}</p>
      <p className="mt-0.5 text-[var(--text-3)]">
        {plan.currency.toUpperCase()} {plan.priceMonthly}/mo
      </p>
      <div className="mt-2">
        {isCurrent ? (
          <span className="text-blue-600 font-medium">Current plan</span>
        ) : stripeConfigured ? (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={() => onCheckout?.(plan.planKey, "monthly")}
          >
            Upgrade
          </Button>
        ) : (
          <span className="text-[var(--text-3)]">Billing not configured</span>
        )}
      </div>
    </div>
  );
}
