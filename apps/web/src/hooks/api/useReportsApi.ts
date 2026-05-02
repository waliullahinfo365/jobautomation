"use client";

import * as api from "@/lib/api/reports.api";
import { useCallback } from "react";
import { useApiMutation } from "./useApiMutation";
import { useApiQuery } from "./useApiQuery";

export function useReportsApi(options?: { fallbackToMock?: boolean; params?: Record<string, unknown> }) {
  const p = options?.params;
  const fb = options?.fallbackToMock;

  const listQuery = useApiQuery(() => api.listReports(p), {
    fallbackToMock: fb,
    mockResourceName: "reportHistory",
  });
  const statsQuery = useApiQuery(() => api.getReportStats(), {
    fallbackToMock: fb,
    mockResourceName: "reportStats",
  });
  const dailyQuery = useApiQuery(() => api.getDailyAnalytics(p), {
    fallbackToMock: fb,
    mockResourceName: "reportDailyAnalytics",
  });
  const weeklyQuery = useApiQuery(() => api.getWeeklyAnalytics(p), {
    fallbackToMock: fb,
    mockResourceName: "reportWeeklyAnalytics",
  });

  const runDailyMutation = useApiMutation((payload?: Record<string, unknown>) => api.runDailyDigest(payload));
  const runWeeklyMutation = useApiMutation((payload?: Record<string, unknown>) => api.runWeeklyReport(payload));
  const sendTestMutation = useApiMutation(({ id, payload }: { id: string; payload?: Record<string, unknown> }) =>
    api.sendReportTest(id, payload)
  );

  const refetchAll = useCallback(async () => {
    await Promise.all([
      listQuery.refetch(),
      statsQuery.refetch(),
      dailyQuery.refetch(),
      weeklyQuery.refetch(),
    ]);
  }, [listQuery, statsQuery, dailyQuery, weeklyQuery]);

  const loading =
    listQuery.loading || statsQuery.loading || dailyQuery.loading || weeklyQuery.loading;
  const error = listQuery.error ?? statsQuery.error ?? dailyQuery.error ?? weeklyQuery.error;
  const isUsingFallback =
    listQuery.isUsingFallback ||
    statsQuery.isUsingFallback ||
    dailyQuery.isUsingFallback ||
    weeklyQuery.isUsingFallback;

  return {
    listQuery,
    statsQuery,
    dailyAnalyticsQuery: dailyQuery,
    weeklyAnalyticsQuery: weeklyQuery,
    list: listQuery.data,
    listReports: listQuery.data,
    data: listQuery.data,
    refetch: refetchAll,
    refetchList: listQuery.refetch,
    getReportStats: statsQuery,
    getDailyAnalytics: dailyQuery,
    getWeeklyAnalytics: weeklyQuery,
    runDailyDigest: runDailyMutation.mutate,
    runWeeklyReport: runWeeklyMutation.mutate,
    sendReportTest: sendTestMutation.mutate,
    loading,
    error,
    isUsingFallback,
    mutations: {
      runDailyLoading: runDailyMutation.loading,
      runWeeklyLoading: runWeeklyMutation.loading,
      sendTestLoading: sendTestMutation.loading,
    },
  };
}
