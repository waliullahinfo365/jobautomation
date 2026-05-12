import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportTypeBadge } from "./ReportTypeBadge";
import type { PDFExportRecord } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";

export function PDFExportsTable({
  records,
  onPreviewText,
  onExportAgain,
  busyId,
}: {
  records: PDFExportRecord[];
  onPreviewText?: (record: PDFExportRecord) => void;
  onExportAgain?: (record: PDFExportRecord) => void;
  busyId?: string | null;
}) {
  const { t, locale } = useTranslation();
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));

  return (
    <SectionCard title={t("reports.pdf.title")} description={t("reports.pdf.subtitle")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("reports.documentName")}</TableHead>
            <TableHead>{t("reports.relatedJob")}</TableHead>
            <TableHead>{t("reports.type")}</TableHead>
            <TableHead>{t("reports.exportStatus")}</TableHead>
            <TableHead>{t("reports.createdAt")}</TableHead>
            <TableHead>{t("reports.export")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.documentName}</TableCell>
              <TableCell>{record.relatedJob}</TableCell>
              <TableCell>
                <ReportTypeBadge type={record.type} />
              </TableCell>
              <TableCell>
                <ReportStatusBadge
                  status={record.exportStatus}
                  tooltip={
                    record.exportStatus === "Preview Only"
                      ? t("reports.noRealPdfProvider")
                      : undefined
                  }
                />
              </TableCell>
              <TableCell>{fmt(record.createdAt)}</TableCell>
              <TableCell>
                {record.exportPublicUrl ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline"
                    onClick={() => window.open(record.exportPublicUrl, "_blank", "noopener,noreferrer")}
                  >
                    {t("reports.openPdf")}
                  </button>
                ) : record.exportStatus === "Failed" ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                    disabled={busyId === record.id || !record.documentId}
                    onClick={() => onExportAgain?.(record)}
                  >
                    {busyId === record.id ? t("reports.pdf.queueing") : t("reports.retryExport")}
                  </button>
                ) : record.exportStatus === "Pending" ? (
                  <span className="text-muted-foreground text-sm">{t("reports.pending")}</span>
                ) : record.textPreviewAvailable && onPreviewText ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline"
                    onClick={() => onPreviewText(record)}
                  >
                    {t("reports.previewText")}
                  </button>
                ) : record.textPreviewAvailable ? (
                  <span className="text-muted-foreground text-sm">{t("reports.textExport")}</span>
                ) : (
                  <span className="text-muted-foreground">{t("reports.pending")}</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  disabled={busyId === record.id || !record.documentId}
                  onClick={() => onExportAgain?.(record)}
                >
                  {busyId === record.id
                    ? t("reports.pdf.queueing")
                    : record.exportStatus === "Failed"
                      ? t("reports.retryExport")
                      : t("reports.exportAgain")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
