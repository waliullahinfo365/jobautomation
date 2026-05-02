"use client";

import * as api from "@/lib/api/tenants.api";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useTenantApi(options?: { fallbackToMock?: boolean; usageParams?: Record<string, unknown> }) {
  const tenant = useApiQuery(() => api.getCurrentTenant(), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "billing",
  });
  const usage = useApiQuery(() => api.getTenantUsage(options?.usageParams), {
    fallbackToMock: options?.fallbackToMock,
    mockResourceName: "billing",
  });

  return {
    tenant,
    usage,
    updateTenant: useApiMutation(api.updateCurrentTenant).mutate,
  };
}
