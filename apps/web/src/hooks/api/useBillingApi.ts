"use client";

import * as api from "@/lib/api/billing.api";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useBillingApi(options?: { fallbackToMock?: boolean }) {
  const plan = useApiQuery(() => api.getBillingPlan(), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "billing",
  });
  const usage = useApiQuery(() => api.getBillingUsage(), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "billing",
  });

  return {
    plan,
    usage,
    checkout: useApiMutation(api.createCheckout).mutate,
    changePlan: useApiMutation(api.changePlan).mutate,
    cancel: useApiMutation(() => api.cancelSubscription()).mutate,
    recalculateUsage: useApiMutation(() => api.recalculateUsage()).mutate,
  };
}
