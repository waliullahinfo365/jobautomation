"use client";

import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import type { PDFExportRecord } from "@/types/document";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { DocumentTypeBadge } from "./DocumentTypeBadge";

export function PDFExportsSection({
  records,
  onPreviewText,
  onExportAgain,
}: {
  records: PDFExportRecord[];
  onPreviewText?: (record: PDFExportRecord) => void;
  onExportAgain?: (record: PDFExportRecord) => void;
}) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <SectionCard title={t("documents.pdfExports.title")} description={t("documents.pdfExports.subtitle")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("documents.pdfExports.documentName")}</TableHead>
            <TableHead>{t("documents.pdfExports.sourceType")}</TableHead>
            <TableHead>{t("documents.pdfExports.relatedJob")}</TableHead>
            <TableHead>{t("documents.pdfExports.exportStatus")}</TableHead>
            <TableHead>{t("documents.pdfExports.createdAt")}</TableHead>
            <TableHead>{t("documents.pdfExports.export")}</TableHead>
            <TableHead className="text-right">{t("documents.pdfExports.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.documentName}</TableCell>
              <TableCell>
                <DocumentTypeBadge type={r.sourceType} />
              </TableCell>
              <TableCell>{r.relatedJob}</TableCell>
              <TableCell>
                <ReportStatusBadge status={r.exportStatus} />
              </TableCell>
              <TableCell>{dateFmt.format(new Date(r.createdAt))}</TableCell>
              <TableCell>
                {r.exportPublicUrl ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline"
                    onClick={() => window.open(r.exportPublicUrl, "_blank", "noopener,noreferrer")}
                  >
                    {t("documents.actions.openPdf")}
                  </button>
                ) : r.textPreviewAvailable && onPreviewText ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline"
                    onClick={() => onPreviewText?.(r)}
                  >
                    {t("documents.actions.previewText")}
                  </button>
                ) : r.textPreviewAvailable ? (
                  <span className="text-muted-foreground text-sm">{t("documents.pdfExports.textExportNote")}</span>
                ) : (
                  <span className="text-muted-foreground">{t("documents.pdfExports.pending")}</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="secondary" onClick={() => onExportAgain?.(r)}>
                  {t("documents.actions.exportAgain")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
