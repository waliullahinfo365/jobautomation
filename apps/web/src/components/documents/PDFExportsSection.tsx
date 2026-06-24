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
      <div className="grid min-w-0 gap-3 p-3 sm:p-4 md:hidden">
        {records.map((r) => (
          <article key={r.id} className="mobile-list-card rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-1)]">{r.documentName}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-3)]">{r.relatedJob || "—"}</p>
              </div>
              <DocumentTypeBadge type={r.sourceType} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ReportStatusBadge status={r.exportStatus} />
              <span className="text-xs text-[var(--text-4)]">{dateFmt.format(new Date(r.createdAt))}</span>
            </div>
            <div className="mobile-card-actions mt-4">
              {r.exportPublicUrl ? (
                <Button type="button" variant="outline" className="min-h-[44px] w-full" onClick={() => window.open(r.exportPublicUrl, "_blank", "noopener,noreferrer")}>
                  {t("documents.actions.openPdf")}
                </Button>
              ) : r.textPreviewAvailable && onPreviewText ? (
                <Button type="button" variant="outline" className="min-h-[44px] w-full" onClick={() => onPreviewText?.(r)}>
                  {t("documents.actions.previewText")}
                </Button>
              ) : null}
              <Button type="button" variant="secondary" className="min-h-[44px] w-full" onClick={() => onExportAgain?.(r)}>
                {t("documents.actions.exportAgain")}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
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
      </div>
    </SectionCard>
  );
}
