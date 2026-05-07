"use client";

import { useMemo, useState } from "react";
import { RefreshIcon, ReportsIcon } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import type {
  ChartDataPoint,
  DailyDigestData,
  PDFExportRecord,
  ReportHistoryRecord,
  ReportTab,
  WeeklyReportData,
} from "@/types/report";
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
  normalizeDocumentRecordsForUi,
  normalizeDocumentRowStatusToPdfStatus,
  normalizeReportStatsForUi,
  normalizeReportsForUi,
  normalizeWeeklyReportDataForUi,
  summarizeGoogleDeliveryWarning,
} from "@/lib/utils/resource";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { useDocumentsApi } from "@/hooks/api/useDocumentsApi";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { getReport } from "@/lib/api/reports.api";
import { getDocument } from "@/lib/api/documents.api";

const initialFilters: ReportFilterState = {
  query: "",
  type: "All",
  status: "All",
  dateRange: "All Dates",
};

const EMPTY_STATS_FALLBACK = {
  reportsGenerated: 0,
  dailyDigestsSent: 0,
  weeklyReportsSent: 0,
  pdfExports: 0,
  successRate: 0,
  lastReport: "—",
};

const EMPTY_DIGEST_FALLBACK: DailyDigestData = {
  date: new Date().toISOString().slice(0, 10),
  newJobsDetected: 0,
  applicationsSent: 0,
  followUpsDue: 0,
  repliesReceived: 0,
  interviewsScheduled: 0,
  deadlinesApproaching: 0,
  failedAutomations: 0,
  recommendedActions: [],
  deliveryStatus: "Generated",
  recipientEmail: "Configured providers only (Telegram primary)",
  lastSentTime: "—",
  nextScheduledTime: "—",
};

const EMPTY_WEEKLY_FALLBACK: WeeklyReportData = {
  weekRange: "—",
  totalJobsFound: 0,
  applicationsSubmitted: 0,
  responseRate: 0,
  interviewConversionRate: 0,
  offersReceived: 0,
  topSources: [],
  bestPerformingCategories: [],
  bottlenecks: [],
  nextWeekFocus: [],
  applicationsBySource: [],
  responseRateTrend: [],
  pipelineConversion: [],
};

type ReportDetailModal = {
  title: string;
  content: string;
  type?: string;
  generatedAt?: string;
  status?: string;
  googleDocUrl?: string;
  pdfUrl?: string;
  metaLines?: string[];
};

function toastReportGenerationSuccess(res: unknown) {
  const r = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
  const status = String(r.status ?? "").toLowerCase();
  const message = String(r.message ?? "").toLowerCase();
  if (status.includes("queued") || message.includes("queued")) {
    showInfo("Report generation started. It will appear in history after the worker finishes.");
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
  const [selectedReport, setSelectedReport] = useState<ReportDetailModal | null>(null);
  const [markdownPreview, setMarkdownPreview] = useState<{ title: string; body: string } | null>(null);
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
      normalizeReportStatsForUi(
        reportsApi.summaryQuery.data ?? reportsApi.statsQuery.data,
        EMPTY_STATS_FALLBACK
      ),
    [reportsApi.summaryQuery.data, reportsApi.statsQuery.data]
  );

  const summaryPayload = reportsApi.summaryQuery.data as Record<string, unknown> | undefined;

  const weeklyTrendFromSummary = useMemo(() => {
    const t = summaryPayload?.weeklyApplicationTrend;
    if (!Array.isArray(t)) return [] as { day: string; applications: number }[];
    return t as { day: string; applications: number }[];
  }, [summaryPayload]);

  const statusBreakdownFromSummary = useMemo(() => {
    const s = summaryPayload?.statusBreakdown;
    if (!Array.isArray(s)) return [] as ChartDataPoint[];
    return s as ChartDataPoint[];
  }, [summaryPayload]);

  const dailyDigestData = useMemo(() => {
    return normalizeDailyDigestDataForUi(reportsApi.dailyAnalyticsQuery.data, EMPTY_DIGEST_FALLBACK);
  }, [reportsApi.dailyAnalyticsQuery.data]);

  const weeklyReportData = useMemo(
    () => normalizeWeeklyReportDataForUi(reportsApi.weeklyAnalyticsQuery.data, EMPTY_WEEKLY_FALLBACK),
    [reportsApi.weeklyAnalyticsQuery.data]
  );

  const overviewSummary = useMemo(() => {
    const perf = summaryPayload?.performanceSummary as Record<string, unknown> | undefined;
    if (perf && typeof perf === "object") {
      return {
        applicationsThisWeek: Number(perf.applicationsThisWeek ?? 0),
        repliesThisWeek: Number(perf.repliesThisWeek ?? 0),
        interviewsThisWeek: Number(perf.interviewsThisWeek ?? 0),
        offersThisWeek: Number(perf.offersThisWeek ?? 0),
        rejectionRate: Number(perf.rejectionRate ?? 0),
        followUpsDue: Number(perf.followUpsDue ?? 0),
      };
    }
    const w = weeklyReportData;
    const d = dailyDigestData;
    const apps = w.applicationsSubmitted;
    const replies = Math.round((w.responseRate / 100) * apps);
    const interviews = Math.round((w.interviewConversionRate / 100) * apps);
    const wm = reportsApi.weeklyAnalyticsQuery.data as Record<string, unknown> | undefined;
    const rejections = Number(wm?.rejections ?? 0);
    return {
      applicationsThisWeek: apps,
      repliesThisWeek: replies,
      interviewsThisWeek: interviews,
      offersThisWeek: w.offersReceived,
      rejectionRate: apps > 0 ? Math.round((rejections / apps) * 100) : 0,
      followUpsDue: d.followUpsDue,
    };
  }, [summaryPayload, weeklyReportData, dailyDigestData, reportsApi.weeklyAnalyticsQuery.data]);

  const pdfRecords: PDFExportRecord[] = useMemo(() => {
    const docs = normalizeDocumentRecordsForUi(normalizeListResponse<unknown>(documentsApi.data));
    const fromDocs = docs
      .filter((d) => ["CV", "Cover Letter", "Research Document", "Other", "PDF Export"].includes(d.type))
      .map((d) => ({
        id: `doc-${d.id}`,
        documentId: d.id,
        documentName: d.fileName,
        relatedJob: d.relatedJob || "Workspace",
        type:
          d.type === "CV"
            ? ("CV" as const)
            : d.type === "Cover Letter"
              ? ("Cover Letter" as const)
              : d.type === "PDF Export"
                ? ("Weekly Report" as const)
                : ("Research Document" as const),
        exportStatus: normalizeDocumentRowStatusToPdfStatus(d),
        createdAt: String(d.lastUpdated),
        pdfLink: d.pdfUrl ?? d.storageUrl ?? "",
      }));

    const fromReports = mergedHistory
      .filter((r) => Boolean(r.pdfUrl || r.googleDocUrl))
      .map((r) => ({
        id: `report-${r.id}`,
        reportId: r.id,
        documentName: r.reportName,
        relatedJob: "Report",
        type: r.type === "Daily Digest" ? ("Daily Digest" as const) : ("Weekly Report" as const),
        exportStatus: r.pdfUrl ? ("Exported" as const) : ("Needs Review" as const),
        createdAt: r.generatedAt,
        pdfLink: r.pdfUrl ?? r.googleDocUrl ?? "",
      }));

    return [...fromReports, ...fromDocs];
  }, [documentsApi.data, mergedHistory]);

  const [refreshing, setRefreshing] = useState(false);
  const refetchAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([reportsApi.refetch(), documentsApi.refetch()]);
    } catch {
      showError("Could not refresh reports.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await reportsApi.generateReport({ type: "weekly-report", send: false, force: true });
      toastReportGenerationSuccess(res);
      await reportsApi.refetch();
    } catch {
      showError("Could not queue report generation.");
    }
  };

  const handleSendTestHistoryRow = async (record: ReportHistoryRecord) => {
    try {
      setBusyRowId(record.id);
      const res = (await reportsApi.sendReportTest({ id: record.id, payload: {} })) as Record<string, unknown>;
      const previewOnly = Boolean(res.previewOnly);
      const msg = String(res.message ?? "");
      const googleHint =
        /Google Docs scope missing|Gmail send scope missing|Missing OAuth scope|Google delivery failed \(403\)/i.test(
          msg,
        );
      if (previewOnly || googleHint) {
        showInfo(msg || "Delivery completed with warnings; see details in message.");
      } else {
        showSuccess(msg || "Report test delivery completed.");
      }
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
            : "";
      const content = markdown.trim()
        ? markdown
        : "Report content is missing. Regenerate this report.";
      const googleDocUrl = typeof data.googleDocUrl === "string" ? data.googleDocUrl : undefined;
      const pdfUrl = typeof row.pdfUrl === "string" ? row.pdfUrl : undefined;
      const metaLines: string[] = [];
      metaLines.push(`Type: ${String(row.type ?? record.type)}`);
      metaLines.push(`Status: ${String(row.status ?? record.status)}`);
      const genAt = row.generatedAt ?? record.generatedAt;
      metaLines.push(`Generated: ${typeof genAt === "string" ? genAt : String(genAt ?? "—")}`);
      metaLines.push(`Delivery: ${String(row.deliveryMethod ?? record.deliveryMethod ?? "—")}`);
      if (data.previewOnly) metaLines.push("Last send: preview only (no provider delivered)");
      const dwHint =
        data.deliveryWarning === true ? summarizeGoogleDeliveryWarning(data as Record<string, unknown>) : undefined;
      if (dwHint) metaLines.push(`Delivery warning: ${dwHint}`);

      setSelectedReport({
        title: String(row.name ?? record.reportName),
        content,
        type: String(row.type ?? ""),
        generatedAt: typeof genAt === "string" ? genAt : undefined,
        status: String(row.status ?? ""),
        googleDocUrl,
        pdfUrl,
        metaLines,
      });
    } catch {
      showError("Could not open report.");
    }
  };

  const handleSendTestDailyDigest = async () => {
    try {
      await reportsApi.sendDailyDigestTest({});
      showInfo("Daily digest test queued. Delivery outcome will appear on the report row and in Automation Logs.");
      await reportsApi.refetch();
    } catch {
      showError("Send test failed.");
    }
  };

  const handleSendTestWeekly = async () => {
    try {
      await reportsApi.sendWeeklyReportTest({});
      showInfo("Weekly report test queued. Delivery outcome will appear on the report row and in Automation Logs.");
      await reportsApi.refetch();
    } catch {
      showError("Send test failed.");
    }
  };

  const handlePreviewDailyDigest = async () => {
    try {
      const data = (await reportsApi.previewDailyDigest({})) as Record<string, unknown>;
      const markdown = typeof data.markdown === "string" ? data.markdown : String(data.summary ?? "");
      setMarkdownPreview({
        title: "Daily Digest Preview",
        body: markdown.trim() ? markdown : "Digest preview unavailable.",
      });
    } catch {
      showError("Could not generate preview.");
    }
  };

  const handlePreviewWeekly = async () => {
    try {
      const data = (await reportsApi.previewWeeklyReport({})) as Record<string, unknown>;
      const markdown = typeof data.markdown === "string" ? data.markdown : String(data.summary ?? "");
      setMarkdownPreview({
        title: "Weekly Report Preview",
        body: markdown.trim() ? markdown : "Weekly preview unavailable.",
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
      return;
    }
    if (record.reportId) {
      await handleViewReport({
        id: record.reportId,
        reportName: record.documentName,
        type: record.type === "Daily Digest" ? "Daily Digest" : "Weekly Performance",
        status: "Generated",
        generatedAt: record.createdAt,
        sentTo: "—",
        deliveryMethod: "dashboard",
      });
    }
  };

  const handleExportAgain = async (record: PDFExportRecord) => {
    if (!record.documentId) {
      showInfo("Report-based rows cannot be re-exported from this action yet. Open the report or connect PDF export for documents.");
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

  const overviewTrend = weeklyTrendFromSummary.length ? weeklyTrendFromSummary : [];
  const overviewStatus = statusBreakdownFromSummary.length ? statusBreakdownFromSummary : [];

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
              {reportsApi.mutations.generateLoading ? "Starting…" : "Generate Report"}
            </Button>
          </div>
        }
      />

      <ReportStatsCards stats={stats} />
      <ReportTabs value={tab} onChange={setTab} />

      {tab === "Overview" ? (
        <ReportsOverview
          summary={overviewSummary}
          weeklyTrendData={overviewTrend}
          statusBreakdownData={overviewStatus}
          history={mergedHistory}
        />
      ) : null}

      {tab === "Daily Digest" ? (
        <DailyDigestPreview
          digest={dailyDigestData}
          onPreviewDigest={() => void handlePreviewDailyDigest()}
          onSendTest={() => void handleSendTestDailyDigest()}
          previewLoading={reportsApi.mutations.previewDailyLoading}
          sendLoading={reportsApi.mutations.sendDailyTestLoading}
        />
      ) : null}

      {tab === "Weekly Report" ? (
        <WeeklyReportPreview
          report={weeklyReportData}
          onPreviewWeekly={() => void handlePreviewWeekly()}
          onSendTest={() => void handleSendTestWeekly()}
          previewLoading={reportsApi.mutations.previewWeeklyLoading}
          sendLoading={reportsApi.mutations.sendWeeklyTestLoading}
        />
      ) : null}

      {tab === "PDF Exports" ? (
        pdfRecords.length === 0 ? (
          <EmptyState
            title="No PDF exports yet"
            description="Generate documents or reports, run PDF export from a document row, or connect Google Drive for automated exports."
          />
        ) : (
          <PDFExportsTable
            records={pdfRecords}
            onExportAgain={(r) => void handleExportAgain(r)}
            onView={(r) => void handleViewPdfRecord(r)}
            busyId={busyRowId}
          />
        )
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
          {selectedReport?.metaLines?.length ? (
            <ul className="space-y-1 text-xs text-[var(--text-3)]">
              {selectedReport.metaLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-[var(--text-2)]">{selectedReport?.content}</pre>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void handleCopyModalContent()}>
              Copy
            </Button>
            <Button type="button" variant="secondary" onClick={handleDownloadTxt}>
              Download .txt
            </Button>
            {selectedReport?.googleDocUrl ? (
              <a
                href={selectedReport.googleDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Open in Google Drive
              </a>
            ) : null}
            {selectedReport?.pdfUrl ? (
              <a
                href={selectedReport.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Open PDF
              </a>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(markdownPreview)} onClose={() => setMarkdownPreview(null)} title={markdownPreview?.title ?? "Preview"} size="lg">
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-[var(--text-2)]">{markdownPreview?.body}</pre>
      </Modal>
    </div>
  );
}
