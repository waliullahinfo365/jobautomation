import type { BillingPlanResponse } from "@/lib/api/billing.api";
import { SettingSectionCard } from "./SettingSectionCard";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";

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
  if (loading) {
    return <LoadingState title="Loading billing" description="Fetching plan and usage..." />;
  }
  if (error) {
    return <ErrorState title="Billing unavailable" message={error} actionLabel="Retry" onAction={onRetry} />;
  }

  const snapshot = billing as BillingPlanResponse;
  const currentPlan = snapshot?.currentPlan?.displayName ?? String((billing as any)?.currentPlan ?? "Unknown");
  const usage = snapshot?.usage ?? {};
  const limits = snapshot?.limits ?? {};
  const availablePlans = snapshot?.availablePlans ?? [];

  return (
    <SettingSectionCard title="Billing" description="Stubbed SaaS billing integration preview for API connectivity.">
      <div className="mb-4 flex items-center justify-between">
        <ApiStatusIndicator usingMock={usingMock} />
        <span className="text-xs text-[var(--text-3)]">Status: {snapshot?.billingStatus ?? "Unknown"}</span>
      </div>
      <div className="space-y-2 text-sm">
        <Field label="Current Plan" value={currentPlan} />
        <Field label="Jobs" value={`${usage.jobsCount ?? 0} / ${limits.maxJobs ?? "-"}`} />
        <Field label="Automation Runs" value={`${usage.automationRunsThisMonth ?? 0} / ${limits.maxAutomationRuns ?? "-"}`} />
        <Field label="AI Credits" value={`${usage.aiCreditsUsedThisMonth ?? 0} / ${limits.maxAiCredits ?? "-"}`} />
        <Field label="Storage Usage" value={`${usage.storageUsedMb ?? 0} / ${limits.maxStorageMb ?? "-"} MB`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onChangePlan?.("starter")}>
          Change to Starter
        </Button>
        <Button onClick={() => onCheckout?.("pro")}>Open Checkout (Pro)</Button>
      </div>
      {availablePlans.length > 0 ? (
        <div className="mt-4 rounded-md border p-3">
          <p className="mb-2 text-xs font-medium text-[var(--text-2)]">Available plans</p>
          <div className="grid gap-1 text-xs text-[var(--text-2)]">
            {availablePlans.map((plan) => (
              <p key={plan.planKey}>
                {plan.displayName} - {plan.currency} {plan.priceMonthly}/mo
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {usingMock ? (
        <p className="mt-3 text-xs text-amber-600">Showing mock fallback billing data because API is unavailable.</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs text-rose-600">{error}</p>
      ) : null}
      <div className="mt-2">
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Refresh
        </Button>
      </div>
    </SettingSectionCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="text-[var(--text-2)]">{value}</p>
    </div>
  );
}
