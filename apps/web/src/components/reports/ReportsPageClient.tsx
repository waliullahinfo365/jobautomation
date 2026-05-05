"use client";

import { useMemo, useState } from "react";
import { RefreshIcon, ReportsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import type { DailyDigestData, PDFExportRecord, ReportHistoryRecord, ReportTab } from "@/types/report";
import {
  mockDailyDigestPreview,
  mockPDFExportRecords,
  mockReportStats,
  mockStatusBreakdownData,
  mockWeeklyReportPreview,
  mockWeeklyTrendData,
} from "@/data/mockReports";
import { ReportStatsCards } from "./ReportStatsCards";
import { ReportTabs } from "./ReportTabs";
import { ReportsOverview } from "./ReportsOverview";
import { DailyDigestPreview } from "./DailyDigestPreview";
import { WeeklyReportPreview } from "./WeeklyReportPreview";
import { PDFExportsTable } from "./PDFExportsTable";
import { ReportFilters, type ReportFilterState } from "./ReportFilters";
import { ReportHistoryTable } from "./ReportHistoryTable";
import { useReportsApi } from "@/hooks/api/useReportsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import {
  normalizeDailyDigestDataForUi,
  normalizeReportStatsForUi,
  normalizeReportsForUi,
  normalizeWeeklyReportDataForUi,
} from "@/lib/utils/resource";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { DEMO_REPORT_EMAIL } from "@/config/env";

const initialFilters: ReportFilterState = {
  query: "",
  type: "All",
  status: "All",
  dateRange: "All Dates",
};

function toastReportGenerationSuccess(res: unknown) {
  const r = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
  const status = String(r.status ?? "").toLowerCase();
  const message = String(r.message ?? "").toLowerCase();
  if (status.includes("queued") || message.includes("queued")) {
    showInfo("Report generation queued. It will appear in history after processing.");
    if (message.includes("worker") || message.includes("memory") || message.includes("facade")) {
      showInfo("Report was queued. Background worker is not enabled yet.");
    }
    return;
  }
  const reportId = String(r.reportId ?? r.id ?? "—");
  showSuccess(`Report generated successfully. Report ID: ${reportId}`);
}

export function ReportsPageClient() {
  const reportsApi = useReportsApi({ fallbackToMock: true });
  const [tab, setTab] = useState<ReportTab>("Overview");
  const [filters, setFilters] = useState<ReportFilterState>(initialFilters);

  const [localReportExtras, setLocalReportExtras] = useState<ReportHistoryRecord[]>([]);
  const [fallbackReportEdits, setFallbackReportEdits] = useState<Record<string, Partial<ReportHistoryRecord>>>({});
  const [localDigestOverlay, setLocalDigestOverlay] = useState<Partial<DailyDigestData>>({});

  const baseHistory = useMemo(
    () => normalizeReportsForUi(normalizeListResponse<unknown>(reportsApi.listQuery.data)),
    [reportsApi.listQuery.data]
  );

  const mergedHistory = useMemo(() => {
    const edited = baseHistory.map((row) => ({ ...row, ...fallbackReportEdits[row.id] }));
    return [...edited, ...localReportExtras];
  }, [baseHistory, fallbackReportEdits, localReportExtras]);

  const filteredHistory = useMemo(() => {
    return mergedHistory.filter((item) => {
      const matchesQuery =
        !filters.query || item.reportName.toLowerCase().includes(filters.query.toLowerCase());
      const matchesType = filters.type === "All" ? true : item.type === filters.type;
      const matchesStatus = filters.status === "All" ? true : item.status === filters.status;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [mergedHistory, filters]);

  const stats = useMemo(
    () => normalizeReportStatsForUi(reportsApi.statsQuery.data, mockReportStats),
    [reportsApi.statsQuery.data]
  );

  const dailyDigestData = useMemo(() => {
    const normalized = normalizeDailyDigestDataForUi(reportsApi.dailyAnalyticsQuery.data, mockDailyDigestPreview);
    return { ...normalized, ...localDigestOverlay };
  }, [reportsApi.dailyAnalyticsQuery.data, localDigestOverlay]);

  const weeklyReportData = useMemo(
    () => normalizeWeeklyReportDataForUi(reportsApi.weeklyAnalyticsQuery.data, mockWeeklyReportPreview),
    [reportsApi.weeklyAnalyticsQuery.data]
  );

  const overviewSummary = useMemo(() => {
    const w = weeklyReportData;
    const d = dailyDigestData;
    const apps = w.applicationsSubmitted;
    const replies = Math.round((w.responseRate / 100) * apps);
    const interviews = Math.round((w.interviewConversionRate / 100) * apps);
    return {
      applicationsThisWeek: apps,
      repliesThisWeek: replies,
      interviewsThisWeek: interviews,
      offersThisWeek: w.offersReceived,
      rejectionRate: Math.max(0, Math.min(100, Math.round(100 - w.responseRate))),
      followUpsDue: d.followUpsDue,
    };
  }, [weeklyReportData, dailyDigestData]);

  const latestDailyReportId = useMemo(() => {
    const row = mergedHistory.find((r) => r.type === "Daily Digest");
    return row?.id;
  }, [mergedHistory]);

  const latestWeeklyReportId = useMemo(() => {
    const row = mergedHistory.find((r) => r.type === "Weekly Performance");
    return row?.id;
  }, [mergedHistory]);

  const [refreshing, setRefreshing] = useState(false);
  const refetchAll = async () => {
    setRefreshing(true);
    try {
      await reportsApi.refetch();
      showSuccess("Reports refreshed.");
    } catch {
      showError("Could not refresh reports.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateReport = async () => {
    const isDaily = tab === "Daily Digest";
    const isWeeklyFamily =
      tab === "Weekly Report" || tab === "Overview" || tab === "PDF Exports" || tab === "Report History";

    try {
      if (reportsApi.isUsingFallback) {
        const id = `local-${Date.now()}`;
        const row: ReportHistoryRecord = {
          id,
          reportName: isDaily ? "Daily Digest (local demo)" : "Weekly Performance (local demo)",
          type: isDaily ? "Daily Digest" : "Weekly Performance",
          status: "Generated",
          generatedAt: new Date().toISOString(),
          sentTo: DEMO_REPORT_EMAIL,
          deliveryMethod: "Email",
        };
        setLocalReportExtras((prev) => [...prev, row]);
        showInfo("API offline, updated demo report locally.");
        return;
      }

      if (isDaily) {
        const res = await reportsApi.runDailyDigest({ send: false, force: false });
        toastReportGenerationSuccess(res);
      } else if (isWeeklyFamily) {
        const res = await reportsApi.runWeeklyReport({ send: false, force: false });
        toastReportGenerationSuccess(res);
      }
      await reportsApi.refetch();
    } catch {
      showError("Could not queue report generation.");
    }
  };

  const patchFallbackSendTest = (recordId: string) => {
    setFallbackReportEdits((prev) => ({
      ...prev,
      [recordId]: { ...prev[recordId], status: "Sent" },
    }));
  };

  const handleSendTestHistoryRow = async (record: ReportHistoryRecord) => {
    if (reportsApi.isUsingFallback) {
      patchFallbackSendTest(record.id);
      showInfo("API offline, updated demo report locally.");
      return;
    }
    try {
      await reportsApi.sendReportTest({ id: record.id, payload: { to: DEMO_REPORT_EMAIL } });
      showSuccess("Test send queued.");
      await reportsApi.refetch();
    } catch {
      showError("Send test failed.");
    }
  };

  const handleSendTestDailyDigest = async () => {
    if (reportsApi.isUsingFallback) {
      if (latestDailyReportId) {
        patchFallbackSendTest(latestDailyReportId);
      } else {
        const id = `local-${Date.now()}`;
        setLocalReportExtras((prev) => [
          ...prev,
          {
            id,
            reportName: "Daily Digest — test",
            type: "Daily Digest",
            status: "Sent",
            generatedAt: new Date().toISOString(),
            sentTo: DEMO_REPORT_EMAIL,
            deliveryMethod: "Email",
          },
        ]);
      }
      setLocalDigestOverlay({ deliveryStatus: "Sent" });
      showInfo("API offline, updated demo report locally.");
      return;
    }
    try {
      if (latestDailyReportId) {
        await reportsApi.sendReportTest({ id: latestDailyReportId, payload: { to: DEMO_REPORT_EMAIL } });
        showSuccess("Test send queued.");
      } else {
        const res = await reportsApi.runDailyDigest({ send: true, force: false });
        toastReportGenerationSuccess(res);
      }
      await reportsApi.refetch();
    } catch {
      showError("Send test failed.");
    }
  };

  const handleSendTestWeekly = async () => {
    if (reportsApi.isUsingFallback) {
      if (latestWeeklyReportId) {
        patchFallbackSendTest(latestWeeklyReportId);
      } else {
        const id = `local-${Date.now()}`;
        setLocalReportExtras((prev) => [
          ...prev,
          {
            id,
            reportName: "Weekly Performance — test",
            type: "Weekly Performance",
            status: "Sent",
            generatedAt: new Date().toISOString(),
            sentTo: DEMO_REPORT_EMAIL,
            deliveryMethod: "Email",
          },
        ]);
      }
      showInfo("API offline, updated demo report locally.");
      return;
    }
    try {
      if (latestWeeklyReportId) {
        await reportsApi.sendReportTest({ id: latestWeeklyReportId, payload: { to: DEMO_REPORT_EMAIL } });
        showSuccess("Test send queued.");
      } else {
        const res = await reportsApi.runWeeklyReport({ send: true, force: false });
        toastReportGenerationSuccess(res);
      }
      await reportsApi.refetch();
    } catch {
      showError("Send test failed.");
    }
  };

  const handleExportAgain = (_record: PDFExportRecord) => {
    showInfo("Export Again will run when document export is linked.");
  };

  const initialListLoading = reportsApi.listQuery.loading && reportsApi.listQuery.data === undefined;
  if (initialListLoading) {
    return (
      <LoadingState title="Loading reports" description="Fetching report history and analytics…" className="min-h-[40vh]" />
    );
  }

  if (reportsApi.error && reportsApi.listQuery.data === undefined && !reportsApi.isUsingFallback) {
    return (
      <ErrorState
        title="Reports unavailable"
        message={reportsApi.error.message}
        actionLabel="Retry"
        onAction={() => void reportsApi.refetch()}
      />
    );
  }

  const genBusy =
    reportsApi.mutations.runDailyLoading ||
    reportsApi.mutations.runWeeklyLoading ||
    reportsApi.mutations.sendTestLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ReportsIcon}
        eyebrow="Insights & Reports"
        title="Reports"
        description="Review daily digests, weekly performance reports, and exported documents."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {reportsApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reportsApi.loading || refreshing}
              onClick={() => void refetchAll()}
            >
              <RefreshIcon size={16} className="mr-1" />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button type="button" onClick={() => void handleGenerateReport()} disabled={genBusy}>
              Generate Report
            </Button>
          </div>
        }
      />

      <ReportStatsCards stats={stats} />
      <ReportTabs value={tab} onChange={setTab} />

      {tab === "Overview" ? (
        <ReportsOverview
          summary={overviewSummary}
          weeklyTrendData={mockWeeklyTrendData}
          statusBreakdownData={mockStatusBreakdownData}
          history={mergedHistory}
        />
      ) : null}

      {tab === "Daily Digest" ? (
        <DailyDigestPreview
          digest={dailyDigestData}
          onPreviewEmail={() =>
            showInfo("Email preview is rendered locally in this demo — no provider message is sent.")
          }
          onSendTest={() => void handleSendTestDailyDigest()}
        />
      ) : null}

      {tab === "Weekly Report" ? (
        <WeeklyReportPreview report={weeklyReportData} onSendTest={() => void handleSendTestWeekly()} />
      ) : null}

      {tab === "PDF Exports" ? (
        <PDFExportsTable records={mockPDFExportRecords} onExportAgain={handleExportAgain} />
      ) : null}

      {tab === "Report History" ? (
        <div className="space-y-4">
          <ReportFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(initialFilters)}
            aside={reportsApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
          />
          {mergedHistory.length === 0 ? (
            <EmptyState
              title="No report history yet"
              description="Generate a report or wait for the next scheduled run."
            />
          ) : filteredHistory.length === 0 ? (
            <EmptyState
              title="No matching reports"
              description="Adjust filters or clear the search query."
              actionLabel="Clear filters"
              onAction={() => setFilters(initialFilters)}
            />
          ) : (
            <ReportHistoryTable records={filteredHistory} onSendTest={(r) => void handleSendTestHistoryRow(r)} />
          )}
        </div>
      ) : null}
    </div>
  );
}
