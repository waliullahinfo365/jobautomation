"use client";

import Link from "next/link";
import { useState } from "react";
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
  onCancelSubscription,
}: BillingSectionProps) {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

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
  const currentPlanKey = currentPlan?.planKey ?? "free";
  const billingStatus = snapshot?.billingStatus ?? "Trialing";
  const usage = snapshot?.usage ?? {};
  const limits = snapshot?.limits ?? {};
  const usagePercentages = snapshot?.usagePercentages ?? {};
  const availablePlans = (snapshot?.availablePlans ?? []).filter((p) => !["free", "free_trial"].includes(p.planKey));
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" size="sm" onClick={onOpenPortal}>
                {t("settings.billing.manageBilling")}
              </Button>
              {!cancelAtPeriodEnd && onCancelSubscription ? (
                <Button variant="ghost" size="sm" className="text-rose-600" onClick={onCancelSubscription}>
                  {t("settings.billing.cancelSubscription")}
                </Button>
              ) : null}
            </div>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-[var(--text-2)]">{t("settings.billing.availablePlans")}</p>
            <div className="inline-flex rounded-md border border-[var(--border)] p-0.5 text-xs">
              <button
                type="button"
                className={`rounded px-2 py-1 ${billingCycle === "monthly" ? "bg-[var(--surface-3)] font-medium" : "text-[var(--text-3)]"}`}
                onClick={() => setBillingCycle("monthly")}
              >
                {t("settings.billing.monthly")}
              </button>
              <button
                type="button"
                className={`rounded px-2 py-1 ${billingCycle === "yearly" ? "bg-[var(--surface-3)] font-medium" : "text-[var(--text-3)]"}`}
                onClick={() => setBillingCycle("yearly")}
              >
                {t("settings.billing.yearly")}
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => (
              <PlanCard
                key={plan.planKey}
                plan={plan}
                billingCycle={billingCycle}
                isCurrent={plan.planKey === currentPlanKey}
                stripeConfigured={stripeConfigured}
                onCheckout={onCheckout}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/pricing">
          <Button variant="outline" size="sm">View all plans</Button>
        </Link>
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
  billingCycle,
  isCurrent,
  stripeConfigured,
  onCheckout,
}: {
  plan: AvailablePlan;
  billingCycle: "monthly" | "yearly";
  isCurrent: boolean;
  stripeConfigured: boolean;
  onCheckout?: (planKey: string, billingCycle: "monthly" | "yearly") => void;
}) {
  const { t } = useTranslation();
  const purchasable = billingCycle === "yearly" ? plan.purchasableYearly : plan.purchasableMonthly;
  const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const priceLabel =
    billingCycle === "yearly"
      ? `${plan.currency.toUpperCase()} ${price}/yr`
      : `${plan.currency.toUpperCase()} ${price}/mo`;

  return (
    <div className={`rounded-md border p-3 text-xs ${isCurrent ? "border-blue-400 bg-blue-50" : "border-[var(--border)] bg-[var(--surface-2)]"}`}>
      <p className="font-semibold text-[var(--text-1)]">{plan.displayName}</p>
      <p className="mt-0.5 text-[var(--text-3)]">{priceLabel}</p>
      <div className="mt-2">
        {isCurrent ? (
          <span className="font-medium text-blue-600">{t("settings.billing.currentPlanBadge")}</span>
        ) : stripeConfigured && purchasable ? (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={() => onCheckout?.(plan.planKey, billingCycle)}
          >
            {t("settings.billing.upgrade")}
          </Button>
        ) : (
          <span className="text-[var(--text-3)]">{t("settings.billing.notAvailable")}</span>
        )}
      </div>
    </div>
  );
}
