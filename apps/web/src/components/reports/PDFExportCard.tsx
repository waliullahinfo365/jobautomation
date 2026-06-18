"use client";

import { Button } from "@/components/ui/button";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportTypeBadge } from "./ReportTypeBadge";
import type { PDFExportRecord } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";

export function PDFExportCard({
  record,
  onPreviewText,
  onExportAgain,
  busyId,
}: {
  record: PDFExportRecord;
  onPreviewText?: (record: PDFExportRecord) => void;
  onExportAgain?: (record: PDFExportRecord) => void;
  busyId?: string | null;
}) {
  const { t, locale } = useTranslation();
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  return (
    <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[var(--text-1)]">{record.documentName}</h3>
          <p className="mt-0.5 truncate text-xs text-[var(--text-3)]">{record.relatedJob || "—"}</p>
        </div>
        <ReportTypeBadge type={record.type} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ReportStatusBadge
          status={record.exportStatus}
          tooltip={record.exportStatus === "Preview Only" ? t("reports.noRealPdfProvider") : undefined}
        />
        <span className="text-xs text-[var(--text-4)]">{fmt(record.createdAt)}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {record.exportPublicUrl ? (
          <Button
            type="button"
            variant="outline"
            className="col-span-2 w-full"
            onClick={() => window.open(record.exportPublicUrl, "_blank", "noopener,noreferrer")}
          >
            {t("reports.openPdf")}
          </Button>
        ) : record.textPreviewAvailable && onPreviewText ? (
          <Button type="button" variant="outline" className="col-span-2 w-full" onClick={() => onPreviewText(record)}>
            {t("reports.previewText")}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="col-span-2 w-full"
          disabled={busyId === record.id || !record.documentId}
          onClick={() => onExportAgain?.(record)}
        >
          {busyId === record.id
            ? t("reports.pdf.queueing")
            : record.exportStatus === "Failed"
              ? t("reports.retryExport")
              : t("reports.exportAgain")}
        </Button>
      </div>
    </article>
  );
}
