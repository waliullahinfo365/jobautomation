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
  const generateMutation = useApiMutation((payload?: Record<string, unknown>) => api.generateReport(payload));
  const previewDailyMutation = useApiMutation((payload?: Record<string, unknown>) => api.previewDailyDigest(payload));
  const previewWeeklyMutation = useApiMutation((payload?: Record<string, unknown>) => api.previewWeeklyReport(payload));
  const sendDailyTestMutation = useApiMutation((payload?: Record<string, unknown>) => api.sendDailyDigestTest(payload));
  const sendWeeklyTestMutation = useApiMutation((payload?: Record<string, unknown>) => api.sendWeeklyReportTest(payload));
  const queuePdfMutation = useApiMutation((payload: { documentId: string }) => api.queuePdfExport(payload));
  const getReportMutation = useApiMutation((id: string) => api.getReport(id));
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
    generateReport: generateMutation.mutate,
    previewDailyDigest: previewDailyMutation.mutate,
    previewWeeklyReport: previewWeeklyMutation.mutate,
    sendDailyDigestTest: sendDailyTestMutation.mutate,
    sendWeeklyReportTest: sendWeeklyTestMutation.mutate,
    queuePdfExport: queuePdfMutation.mutate,
    getReport: getReportMutation.mutate,
    sendReportTest: sendTestMutation.mutate,
    loading,
    error,
    isUsingFallback,
    mutations: {
      runDailyLoading: runDailyMutation.loading,
      runWeeklyLoading: runWeeklyMutation.loading,
      generateLoading: generateMutation.loading,
      previewDailyLoading: previewDailyMutation.loading,
      previewWeeklyLoading: previewWeeklyMutation.loading,
      sendDailyTestLoading: sendDailyTestMutation.loading,
      sendWeeklyTestLoading: sendWeeklyTestMutation.loading,
      queuePdfLoading: queuePdfMutation.loading,
      getReportLoading: getReportMutation.loading,
      sendTestLoading: sendTestMutation.loading,
    },
  };
}
