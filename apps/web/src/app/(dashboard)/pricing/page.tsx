import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingPageClient } from "@/components/billing/PricingPageClient";
import { LoadingState } from "@/components/shared/LoadingState";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading pricing" description="Fetching plans..." />}>
      <PricingPageClient />
    </Suspense>
  );
}
