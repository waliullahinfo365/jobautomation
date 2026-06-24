"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useBillingApi } from "@/hooks/api/useBillingApi";
import { showError } from "@/lib/ui/toast";
import type { AvailablePlan } from "@/lib/api/billing.api";

const PAID_PLANS = ["plus", "pro", "executive", "founding_pro"];

export function PricingPageClient() {
  const billing = useBillingApi({ fallbackToMock: false });
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const snapshot = billing.plan.data as Record<string, unknown> | undefined;
  const availablePlans = ((snapshot?.availablePlans as AvailablePlan[]) ?? []).filter((p) =>
    PAID_PLANS.includes(p.planKey)
  );
  const currentPlanKey = String((snapshot?.currentPlan as { planKey?: string } | undefined)?.planKey ?? "free");
  const stripeConfigured = Boolean(snapshot?.stripeConfigured);
  const taxNotice = String(snapshot?.taxNotice ?? "");

  const handleCheckout = async (planKey: string) => {
    try {
      const result = await billing.checkout({ planKey, billingCycle });
      const checkoutUrl = (result as { checkoutUrl?: string })?.checkoutUrl;
      if (checkoutUrl) window.location.href = checkoutUrl;
      else showError("No checkout URL returned.");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Checkout failed");
    }
  };

  return (
    <div className="space-y-6 pb-10 sm:space-y-8">
      <PageHeader
        eyebrow="Pricing"
        title="Choose the plan that fits your job search"
        description="Track jobs, prepare documents, manage applications, and never miss a follow-up."
        actions={
          <Link href="/settings?section=Billing">
            <Button variant="outline">Manage Plan</Button>
          </Link>
        }
      />

      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-[var(--border)] p-1 text-sm">
          <button
            type="button"
            className={`rounded-md px-4 py-2 min-h-[44px] ${billingCycle === "monthly" ? "bg-[var(--accent-bg)] font-medium" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-2 min-h-[44px] ${billingCycle === "yearly" ? "bg-[var(--accent-bg)] font-medium" : ""}`}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>

      {taxNotice ? <p className="text-center text-xs text-[var(--text-3)]">{taxNotice}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {availablePlans.map((plan) => {
          const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
          const purchasable = billingCycle === "yearly" ? plan.purchasableYearly : plan.purchasableMonthly;
          const isCurrent = plan.planKey === currentPlanKey;
          const isPopular = plan.planKey === "pro";

          return (
            <div
              key={plan.planKey}
              className={`relative flex flex-col rounded-xl border p-5 ${
                isPopular ? "border-blue-500 shadow-md" : "border-[var(--border)] bg-[var(--surface-2)]"
              }`}
            >
              {isPopular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                  Most Popular
                </span>
              ) : null}
              <h3 className="text-lg font-semibold text-[var(--text-1)]">{plan.displayName}</h3>
              <p className="mt-1 text-sm text-[var(--text-3)]">{(plan as { tagline?: string }).tagline ?? ""}</p>
              <p className="mt-4 text-2xl font-bold text-[var(--text-1)]">
                €{price}
                <span className="text-sm font-normal text-[var(--text-3)]">
                  /{billingCycle === "yearly" ? "yr" : "mo"}
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--text-2)]">
                {(plan.features ?? []).slice(0, 6).map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : stripeConfigured && purchasable ? (
                  <Button className="w-full" onClick={() => handleCheckout(plan.planKey)}>
                    Upgrade to {plan.displayName}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Not available
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
        <h3 className="font-semibold text-[var(--text-1)]">Extra AI credits</h3>
        <p className="mt-1 text-sm text-[var(--text-3)]">One-time packs. Purchased credits stay until used.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            variant="outline"
            disabled={!stripeConfigured}
            className="w-full sm:w-auto"
            onClick={async () => {
              try {
                const result = await billing.creditsCheckout({ pack: "50" });
                const url = (result as { checkoutUrl?: string })?.checkoutUrl;
                if (url) window.location.href = url;
              } catch (e) {
                showError(e instanceof Error ? e.message : "Checkout failed");
              }
            }}
          >
            50 AI credits — €4.99
          </Button>
          <Button
            variant="outline"
            disabled={!stripeConfigured}
            className="w-full sm:w-auto"
            onClick={async () => {
              try {
                const result = await billing.creditsCheckout({ pack: "150" });
                const url = (result as { checkoutUrl?: string })?.checkoutUrl;
                if (url) window.location.href = url;
              } catch (e) {
                showError(e instanceof Error ? e.message : "Checkout failed");
              }
            }}
          >
            150 AI credits — €9.99
          </Button>
        </div>
      </div>
    </div>
  );
}
