"use client";

import { useMemo, useState } from "react";
import { RefreshIcon, ReportsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import type { DailyDigestData, PDFExportRecord, ReportHistoryRecord, ReportTab } from "@/types/report";
import {
  mockDailyDigestPreview,
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
import { useDocumentsApi } from "@/hooks/api/useDocumentsApi";
import { normalizeDocumentRecordsForUi, normalizeDocumentRowStatusToPdfStatus } from "@/lib/utils/resource";
import { Modal } from "@/components/ui/modal";
import { getReport } from "@/lib/api/reports.api";
import { getDocument } from "@/lib/api/documents.api";

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
  const reportsApi = useReportsApi({ fallbackToMock: false });
  const documentsApi = useDocumentsApi({ fallbackToMock: false });
  const [tab, setTab] = useState<ReportTab>("Overview");
  const [filters, setFilters] = useState<ReportFilterState>(initialFilters);
  const [selectedReport, setSelectedReport] = useState<{ title: string; content: string } | null>(null);
  const [previewEmail, setPreviewEmail] = useState<{ title: string; body: string } | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const baseHistory = useMemo(
    () => normalizeReportsForUi(normalizeListResponse<unknown>(reportsApi.listQuery.data)),
    [reportsApi.listQuery.data]
  );

  const mergedHistory = baseHistory;

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
    () =>
      normalizeReportStatsForUi(reportsApi.statsQuery.data, {
        reportsGenerated: 0,
        dailyDigestsSent: 0,
        weeklyReportsSent: 0,
        pdfExports: 0,
        successRate: 0,
        lastReport: "—",
      }),
    [reportsApi.statsQuery.data]
  );

  const dailyDigestData = useMemo(() => {
    const normalized = normalizeDailyDigestDataForUi(reportsApi.dailyAnalyticsQuery.data, mockDailyDigestPreview);
    return normalized;
  }, [reportsApi.dailyAnalyticsQuery.data]);

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

  const pdfRecords: PDFExportRecord[] = useMemo(() => {
    const docs = normalizeDocumentRecordsForUi(normalizeListResponse<unknown>(documentsApi.data));
    return docs
      .filter((d) => ["CV", "Cover Letter", "Research Document"].includes(d.type))
      .map((d) => ({
        id: `doc-${d.id}`,
        documentId: d.id,
        documentName: d.fileName,
        relatedJob: d.relatedJob || "Workspace",
        type:
          d.type === "CV"
            ? "CV"
            : d.type === "Cover Letter"
              ? "Cover Letter"
              : "Research Document",
        exportStatus: normalizeDocumentRowStatusToPdfStatus(d),
        createdAt: String(d.lastUpdated),
        pdfLink: d.pdfUrl ?? d.storageUrl ?? "",
      }));
  }, [documentsApi.data]);

  const [refreshing, setRefreshing] = useState(false);
  const refetchAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([reportsApi.refetch(), documentsApi.refetch()]);
      showSuccess("Reports refreshed.");
    } catch {
      showError("Could not refresh reports.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await reportsApi.generateReport({ send: false, force: false });
      toastReportGenerationSuccess(res);
      await reportsApi.refetch();
    } catch {
      showError("Could not queue report generation.");
    }
  };

  const handleSendTestHistoryRow = async (record: ReportHistoryRecord) => {
    try {
      setBusyRowId(record.id);
      await reportsApi.sendReportTest({ id: record.id, payload: { to: DEMO_REPORT_EMAIL } });
      showSuccess("Test send queued.");
      await reportsApi.refetch();
    } catch {
      showError("Send test failed.");
    } finally {
      setBusyRowId(null);
    }
  };

  const handleViewReport = async (record: ReportHistoryRecord) => {
    try {
      const row = (await getReport(record.id)) as Record<string, unknown>;
      const data = (row.data as Record<string, unknown> | undefined) ?? {};
      const markdown =
        typeof data.markdown === "string"
          ? data.markdown
          : typeof row.summaryText === "string"
            ? row.summaryText
            : "No report content available.";
      setSelectedReport({ title: record.reportName, content: markdown });
    } catch {
      showError("Could not open report.");
    }
  };

  const handleSendTestDailyDigest = async () => {
    try {
      await reportsApi.sendDailyDigestTest({ to: DEMO_REPORT_EMAIL });
      showInfo("Daily digest test queued.");
      await reportsApi.refetch();
    } catch {
      showError("Send test failed.");
    }
  };

  const handleSendTestWeekly = async () => {
    try {
      await reportsApi.sendWeeklyReportTest({ to: DEMO_REPORT_EMAIL });
      showInfo("Weekly report test queued.");
      await reportsApi.refetch();
    } catch {
      showError("Send test failed.");
    }
  };

  const handlePreviewDailyDigest = async () => {
    try {
      const data = (await reportsApi.previewDailyDigest({})) as Record<string, unknown>;
      const summary = String(data.summary ?? "Daily digest preview unavailable.");
      const rec = Array.isArray(data.recommendations) ? (data.recommendations as string[]) : [];
      setPreviewEmail({
        title: "Daily Digest Preview",
        body: [summary, "", "Recommended actions:", ...rec.map((r) => `- ${r}`)].join("\n"),
      });
    } catch {
      showError("Could not generate preview.");
    }
  };

  const handleViewPdfRecord = async (record: PDFExportRecord) => {
    if (record.pdfLink) {
      window.open(record.pdfLink, "_blank", "noopener,noreferrer");
      return;
    }
    if (record.documentId) {
      try {
        const doc = (await getDocument(record.documentId)) as unknown as { contentText?: string };
        const text = typeof doc.contentText === "string" && doc.contentText.trim() ? doc.contentText : "No text content available.";
        setSelectedReport({ title: record.documentName, content: text });
      } catch {
        showError("Could not open export source.");
      }
    }
  };

  const handleExportAgain = async (record: PDFExportRecord) => {
    if (!record.documentId) {
      showInfo("This export is report-based and cannot be re-queued from documents.");
      return;
    }
    try {
      setBusyRowId(record.id);
      const res = await reportsApi.queuePdfExport({ documentId: record.documentId });
      const msg = String((res as Record<string, unknown>).message ?? "");
      showInfo(msg || "PDF export queued.");
      await Promise.all([reportsApi.refetch(), documentsApi.refetch()]);
    } catch {
      showError("Could not queue PDF export.");
    } finally {
      setBusyRowId(null);
    }
  };

  const handleDownloadTxt = () => {
    if (!selectedReport) return;
    const blob = new Blob([selectedReport.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyModalContent = async () => {
    if (!selectedReport) return;
    await navigator.clipboard.writeText(selectedReport.content);
    showSuccess("Copied to clipboard.");
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
    reportsApi.mutations.generateLoading ||
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
          onPreviewEmail={() => void handlePreviewDailyDigest()}
          onSendTest={() => void handleSendTestDailyDigest()}
        />
      ) : null}

      {tab === "Weekly Report" ? (
        <WeeklyReportPreview report={weeklyReportData} onSendTest={() => void handleSendTestWeekly()} />
      ) : null}

      {tab === "PDF Exports" ? (
        <PDFExportsTable records={pdfRecords} onExportAgain={(r) => void handleExportAgain(r)} onView={(r) => void handleViewPdfRecord(r)} busyId={busyRowId} />
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
            <ReportHistoryTable
              records={filteredHistory}
              onView={(r) => void handleViewReport(r)}
              onSendTest={(r) => void handleSendTestHistoryRow(r)}
              busyId={busyRowId}
            />
          )}
        </div>
      ) : null}
      <Modal isOpen={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} title={selectedReport?.title ?? "Report"} size="lg">
        <div className="space-y-3">
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-[var(--text-2)]">{selectedReport?.content}</pre>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void handleCopyModalContent()}>Copy</Button>
            <Button type="button" variant="secondary" onClick={handleDownloadTxt}>Download .txt</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={Boolean(previewEmail)} onClose={() => setPreviewEmail(null)} title={previewEmail?.title ?? "Email Preview"} size="lg">
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-[var(--text-2)]">{previewEmail?.body}</pre>
      </Modal>
    </div>
  );
}
