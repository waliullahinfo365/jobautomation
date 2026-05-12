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
  summarizeProviderResults,
} from "@/lib/utils/resource";
import { invalidateApiCache } from "@/lib/api/client";
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
import { API_URL } from "@/config/env";
import { isPublicFileUrl } from "@/lib/utils/is-public-file-url";
import { useTranslation } from "@/i18n/I18nProvider";

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
  reportId?: string;
  reportTypeLabel?: string;
  documentId?: string;
  type?: string;
  generatedAt?: string;
  status?: string;
  deliveryMethod?: string;
  deliveryStatus?: string;
  deliveryOutcome?: string;
  sentTo?: string;
  previewOnly?: boolean;
  deliveryWarning?: boolean;
  googleDeliveryHint?: string;
  providerSummary?: string;
  googleDocUrl?: string;
  pdfUrl?: string;
  metaLines?: string[];
  pdfUnavailableNotice?: string;
  contentMissing?: boolean;
};

export function ReportsPageClient() {
  const { t } = useTranslation();

  function toastReportGenerationSuccess(res: unknown) {
    const r = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
    const status = String(r.status ?? "").toLowerCase();
    const message = String(r.message ?? "").toLowerCase();
    if (status.includes("queued") || message.includes("queued")) {
      showInfo(t("reports.toast.generationQueued"));
      return;
    }
    const reportId = String(r.reportId ?? r.id ?? "—");
    showSuccess(t("reports.toast.generationSuccess").replace("{id}", reportId));
  }

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
    const trend = summaryPayload?.weeklyApplicationTrend;
    if (!Array.isArray(trend)) return [] as { day: string; applications: number }[];
    return trend as { day: string; applications: number }[];
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
      .map((d) => {
        const raw = (d as unknown as { metadata?: Record<string, unknown> }).metadata ?? {};
        const meta = typeof raw === "object" && raw !== null ? raw : {};
        const exportPublicUrl =
          (d.pdfUrl && isPublicFileUrl(d.pdfUrl, API_URL) ? d.pdfUrl : "") ||
          (d.storageUrl && isPublicFileUrl(d.storageUrl, API_URL) ? d.storageUrl : "") ||
          "";
        const textPreviewAvailable =
          d.pdfExportStatus === "Preview Only" ||
          meta.textExportAvailable === true ||
          meta.exportStatus === "preview-only" ||
          meta.exportStatus === "completed-text";
        return {
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
          exportPublicUrl,
          textPreviewAvailable,
          pdfLink: exportPublicUrl,
        };
      });

    const fromReports = mergedHistory
      .filter((r) => Boolean(r.pdfUrl || r.googleDocUrl))
      .map((r) => {
        const exportPublicUrl =
          (r.pdfUrl && isPublicFileUrl(r.pdfUrl, API_URL) ? r.pdfUrl : "") ||
          (r.googleDocUrl && isPublicFileUrl(r.googleDocUrl, API_URL) ? r.googleDocUrl : "") ||
          "";
        const textPreviewAvailable = !exportPublicUrl;
        return {
          id: `report-${r.id}`,
          reportId: r.id,
          documentName: r.reportName,
          relatedJob: "Report",
          type: r.type === "Daily Digest" ? ("Daily Digest" as const) : ("Weekly Report" as const),
          exportStatus: r.pdfUrl && exportPublicUrl ? ("Exported" as const) : ("Needs Review" as const),
          createdAt: r.generatedAt,
          exportPublicUrl,
          textPreviewAvailable,
          pdfLink: exportPublicUrl,
        };
      });

    return [...fromReports, ...fromDocs];
  }, [documentsApi.data, mergedHistory]);

  const [refreshing, setRefreshing] = useState(false);
  const refetchAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([reportsApi.refetch(), documentsApi.refetch()]);
    } catch {
      showError(t("reports.toast.refreshFailed"));
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
      showError(t("reports.toast.generateFailed"));
    }
  };

  const handleSendTestHistoryRow = async (record: ReportHistoryRecord) => {
    try {
      setBusyRowId(record.id);
      const res = (await reportsApi.sendReportTest({ id: record.id, payload: {} })) as Record<string, unknown>;
      const previewOnly = Boolean(res.previewOnly);
      const deliveryWarning = Boolean(res.deliveryWarning);
      const msg = String(res.message ?? "");
      const googleHint =
        /Google Docs scope missing|Gmail send scope missing|Missing OAuth scope|Google delivery failed \(403\)/i.test(msg);
      if (previewOnly) {
        showInfo(t("reports.toast.noProviderConfigured"));
      } else if (deliveryWarning || googleHint) {
        showInfo(msg || t("reports.toast.deliveryWithWarnings"));
      } else {
        showSuccess(msg || t("reports.toast.testDeliveryCompleted"));
      }
      invalidateApiCache("/notifications");
      invalidateApiCache("/automation");
      await reportsApi.refetch();
    } catch {
      showError(t("reports.toast.sendTestFailed"));
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
      const contentMissing = !markdown.trim();
      const content = contentMissing ? t("reports.modal.reportContentMissing") : markdown;
      const googleDocUrlRaw = typeof data.googleDocUrl === "string" ? data.googleDocUrl : undefined;
      const pdfUrlRaw = typeof row.pdfUrl === "string" ? row.pdfUrl : undefined;
      const googleDocUrl =
        googleDocUrlRaw && isPublicFileUrl(googleDocUrlRaw, API_URL) ? googleDocUrlRaw : undefined;
      const pdfUrl = pdfUrlRaw && isPublicFileUrl(pdfUrlRaw, API_URL) ? pdfUrlRaw : undefined;
      const metaLines: string[] = [];
      metaLines.push(`Type: ${String(row.type ?? record.type)}`);
      metaLines.push(`Status: ${String(row.status ?? record.status)}`);
      const genAt = row.generatedAt ?? record.generatedAt;
      metaLines.push(`Generated: ${typeof genAt === "string" ? genAt : String(genAt ?? "—")}`);
      metaLines.push(`Delivery status: ${String(row.deliveryStatus ?? record.deliveryStatus ?? "—")}`);
      metaLines.push(`Delivery method: ${String(row.deliveryMethod ?? record.deliveryMethod ?? "—")}`);
      const sentArr = row.sentTo;
      const sentJoined = Array.isArray(sentArr)
        ? sentArr.filter(Boolean).join(", ")
        : typeof sentArr === "string"
          ? sentArr
          : record.sentTo;
      metaLines.push(`Sent to: ${sentJoined || "—"}`);
      const outcome = typeof data.deliveryOutcome === "string" ? data.deliveryOutcome : record.deliveryOutcome;
      if (outcome) metaLines.push(`Outcome: ${outcome}`);
      if (data.previewOnly) metaLines.push("Last send: preview only (no external channel delivered)");
      const googleHint = summarizeGoogleDeliveryWarning(data as Record<string, unknown>);
      if (googleHint) metaLines.push(`Google delivery: ${googleHint}`);
      const providerSummary = summarizeProviderResults(data as Record<string, unknown>);
      const deliveryWarning =
        Boolean(data.deliveryWarning) || outcome === "Delivery warning" || Boolean(record.deliveryWarning);

      setSelectedReport({
        title: String(row.name ?? record.reportName),
        content,
        reportId: record.id,
        reportTypeLabel: String(row.type ?? record.type),
        type: String(row.type ?? ""),
        generatedAt: typeof genAt === "string" ? genAt : undefined,
        status: String(row.status ?? ""),
        deliveryMethod: String(row.deliveryMethod ?? record.deliveryMethod ?? ""),
        deliveryStatus: String(row.deliveryStatus ?? record.deliveryStatus ?? ""),
        deliveryOutcome: outcome,
        sentTo: sentJoined || "—",
        previewOnly: Boolean(data.previewOnly),
        deliveryWarning,
        googleDeliveryHint: googleHint,
        providerSummary,
        googleDocUrl,
        pdfUrl,
        metaLines,
        contentMissing,
      });
    } catch {
      showError(t("reports.toast.couldNotOpenReport"));
    }
  };

  const handleSendTestDailyDigest = async () => {
    try {
      await reportsApi.sendDailyDigestTest({});
      showInfo(t("reports.toast.dailyDigestTestQueued"));
      await reportsApi.refetch();
    } catch {
      showError(t("reports.toast.sendTestFailed"));
    }
  };

  const handleSendTestWeekly = async () => {
    try {
      await reportsApi.sendWeeklyReportTest({});
      showInfo(t("reports.toast.weeklyTestQueued"));
      await reportsApi.refetch();
    } catch {
      showError(t("reports.toast.sendTestFailed"));
    }
  };

  const handlePreviewDailyDigest = async () => {
    try {
      const data = (await reportsApi.previewDailyDigest({})) as Record<string, unknown>;
      const markdown = typeof data.markdown === "string" ? data.markdown : String(data.summary ?? "");
      setMarkdownPreview({
        title: t("reports.daily.title"),
        body: markdown.trim() ? markdown : t("reports.toast.digestPreviewUnavailable"),
      });
    } catch {
      showError(t("reports.toast.couldNotGeneratePreview"));
    }
  };

  const handlePreviewWeekly = async () => {
    try {
      const data = (await reportsApi.previewWeeklyReport({})) as Record<string, unknown>;
      const markdown = typeof data.markdown === "string" ? data.markdown : String(data.summary ?? "");
      setMarkdownPreview({
        title: t("reports.weekly.title"),
        body: markdown.trim() ? markdown : t("reports.toast.weeklyPreviewUnavailable"),
      });
    } catch {
      showError(t("reports.toast.couldNotGeneratePreview"));
    }
  };

  const handleViewPdfRecord = async (record: PDFExportRecord) => {
    if (record.exportPublicUrl) {
      window.open(record.exportPublicUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (record.documentId) {
      try {
        const doc = (await getDocument(record.documentId)) as unknown as Record<string, unknown>;
        const meta =
          doc.metadata && typeof doc.metadata === "object"
            ? (doc.metadata as Record<string, unknown>)
            : {};
        const text =
          typeof doc.contentText === "string" && doc.contentText.trim()
            ? doc.contentText
            : typeof meta.textExportContent === "string"
              ? meta.textExportContent
              : t("reports.modal.noTextContent");
        setSelectedReport({
          title: record.documentName,
          content: text,
          type: record.type,
          documentId: record.documentId,
          pdfUnavailableNotice:
            record.textPreviewAvailable || !record.exportPublicUrl
              ? t("reports.modal.pdfProviderNotConfigured")
              : undefined,
        });
      } catch {
        showError(t("reports.toast.couldNotOpenExport"));
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
      showInfo(t("reports.toast.reportBasedNoReExport"));
      return;
    }
    try {
      setBusyRowId(record.id);
      const res = await reportsApi.queuePdfExport({ documentId: record.documentId });
      const msg = String((res as Record<string, unknown>).message ?? "");
      showInfo(msg || t("reports.toast.pdfExportQueued"));
      invalidateApiCache("/notifications");
      await Promise.all([reportsApi.refetch(), documentsApi.refetch()]);
    } catch {
      showError(t("reports.toast.pdfExportFailed"));
    } finally {
      setBusyRowId(null);
    }
  };

  const handleRegenerateFromModal = async () => {
    if (!selectedReport?.reportId || !selectedReport.reportTypeLabel) return;
    const reportType =
      selectedReport.reportTypeLabel === "Daily Digest"
        ? "daily-digest"
        : selectedReport.reportTypeLabel === "Weekly Performance"
          ? "weekly-report"
          : "weekly-report";
    try {
      await reportsApi.generateReport({ type: reportType, force: true, send: false });
      showSuccess(t("reports.toast.regenerationQueued"));
      setSelectedReport(null);
      await reportsApi.refetch();
    } catch {
      showError(t("reports.toast.regenerationFailed"));
    }
  };

  const handleExportPdfFromModal = async () => {
    if (!selectedReport?.documentId) return;
    try {
      const res = await reportsApi.queuePdfExport({ documentId: selectedReport.documentId });
      const msg = String((res as Record<string, unknown>).message ?? "");
      showInfo(msg || t("reports.toast.pdfExportQueued"));
      invalidateApiCache("/notifications");
      await Promise.all([reportsApi.refetch(), documentsApi.refetch()]);
      setSelectedReport(null);
    } catch {
      showError(t("reports.toast.pdfExportFailed"));
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
    showSuccess(t("reports.toast.copiedToClipboard"));
  };

  const initialListLoading = reportsApi.listQuery.loading && reportsApi.listQuery.data === undefined;
  if (initialListLoading) {
    return (
      <LoadingState title={t("reports.loading")} description={t("reports.loading")} className="min-h-[40vh]" />
    );
  }

  if (reportsApi.error && reportsApi.listQuery.data === undefined && !reportsApi.isUsingFallback) {
    return (
      <ErrorState
        title={t("reports.noReports")}
        message={reportsApi.error.message}
        actionLabel={t("common.retry")}
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
        eyebrow={t("reports.eyebrow")}
        title={t("reports.title")}
        description={t("reports.description")}
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
              {refreshing ? t("reports.refreshing") : t("reports.refresh")}
            </Button>
            <Button type="button" onClick={() => void handleGenerateReport()} disabled={genBusy}>
              {reportsApi.mutations.generateLoading ? t("reports.starting") : t("reports.generateReport")}
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
            title={t("reports.empty.noPdfExports")}
            description={t("reports.empty.noPdfExportsDesc")}
          />
        ) : (
          <PDFExportsTable
            records={pdfRecords}
            onPreviewText={(r) => void handleViewPdfRecord(r)}
            onExportAgain={(r) => void handleExportAgain(r)}
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
              title={t("reports.empty.noHistory")}
              description={t("reports.empty.noHistoryDesc")}
            />
          ) : filteredHistory.length === 0 ? (
            <EmptyState
              title={t("reports.empty.noMatching")}
              description={t("reports.empty.noMatchingDesc")}
              actionLabel={t("reports.empty.clearFilters")}
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

      <Modal isOpen={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} title={selectedReport?.title ?? t("reports.reportType.weeklyReport")} size="lg">
        <div className="space-y-3">
          {(selectedReport?.deliveryWarning ||
            selectedReport?.previewOnly ||
            Boolean(selectedReport?.providerSummary) ||
            Boolean(selectedReport?.googleDeliveryHint)) &&
          !selectedReport?.pdfUnavailableNotice ? (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-[var(--text-2)]">
              <p className="font-medium text-amber-200">{t("reports.modal.deliveryDetails")}</p>
              {selectedReport?.previewOnly ? (
                <p className="mt-1 text-xs">
                  {t("reports.modal.noExternalProvider")}
                </p>
              ) : null}
              {selectedReport?.googleDeliveryHint ? (
                <p className="mt-1 text-xs whitespace-pre-wrap">{selectedReport.googleDeliveryHint}</p>
              ) : null}
              {selectedReport?.providerSummary ? (
                <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap text-[11px] text-[var(--text-3)]">
                  {selectedReport.providerSummary}
                </pre>
              ) : null}
              {selectedReport?.deliveryWarning &&
              !selectedReport?.providerSummary &&
              !selectedReport?.googleDeliveryHint &&
              !selectedReport?.previewOnly ? (
                <p className="mt-1 text-xs">{t("reports.modal.deliveryWarningGeneric")}</p>
              ) : null}
            </div>
          ) : null}
          {selectedReport?.pdfUnavailableNotice ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-[var(--text-2)]">
              {selectedReport.pdfUnavailableNotice}
            </p>
          ) : null}
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
              {t("reports.modal.copy")}
            </Button>
            <Button type="button" variant="secondary" onClick={handleDownloadTxt}>
              {t("reports.modal.downloadTxt")}
            </Button>
            {selectedReport?.documentId ? (
              <Button
                type="button"
                variant="outline"
                disabled={reportsApi.mutations.queuePdfLoading}
                onClick={() => void handleExportPdfFromModal()}
              >
                {reportsApi.mutations.queuePdfLoading ? t("reports.modal.queueing") : t("reports.modal.exportToPdf")}
              </Button>
            ) : null}
            {selectedReport?.contentMissing && selectedReport.reportId ? (
              <Button type="button" variant="default" onClick={() => void handleRegenerateFromModal()}>
                {t("reports.modal.regenerateReport")}
              </Button>
            ) : null}
            {selectedReport?.googleDocUrl && isPublicFileUrl(selectedReport.googleDocUrl, API_URL) ? (
              <a
                href={selectedReport.googleDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                {t("reports.modal.openInGoogleDrive")}
              </a>
            ) : null}
            {selectedReport?.pdfUrl && isPublicFileUrl(selectedReport.pdfUrl, API_URL) ? (
              <a
                href={selectedReport.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                {t("reports.modal.openPdf")}
              </a>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(markdownPreview)} onClose={() => setMarkdownPreview(null)} title={markdownPreview?.title ?? t("reports.previewText")} size="lg">
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-[var(--text-2)]">{markdownPreview?.body}</pre>
      </Modal>
    </div>
  );
}
