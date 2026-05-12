"use client";

import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import type { CoverLetterRecord } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";

export function CoverLettersSection({ records }: { records: CoverLetterRecord[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <SectionCard title={t("documents.coverLetters.title")} description={t("documents.coverLetters.subtitle")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("documents.coverLetters.fileName")}</TableHead>
            <TableHead>{t("documents.coverLetters.company")}</TableHead>
            <TableHead>{t("documents.coverLetters.position")}</TableHead>
            <TableHead>{t("documents.coverLetters.relatedJob")}</TableHead>
            <TableHead>{t("documents.coverLetters.status")}</TableHead>
            <TableHead>{t("documents.coverLetters.aiGenerated")}</TableHead>
            <TableHead>{t("documents.coverLetters.pdfExport")}</TableHead>
            <TableHead>{t("documents.coverLetters.lastUpdated")}</TableHead>
            <TableHead className="text-right">{t("documents.coverLetters.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.fileName}</TableCell>
              <TableCell>{r.company}</TableCell>
              <TableCell>{r.position}</TableCell>
              <TableCell>{r.relatedJob}</TableCell>
              <TableCell><DocumentStatusBadge status={r.status} /></TableCell>
              <TableCell>{r.aiGenerated ? t("documents.coverLetters.yes") : t("documents.coverLetters.no")}</TableCell>
              <TableCell><ReportStatusBadge status={r.pdfExportStatus} /></TableCell>
              <TableCell>{dateFmt.format(new Date(r.lastUpdated))}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-2">
                  <Button size="sm" variant="outline">{t("documents.actions.view")}</Button>
                  <Button size="sm" variant="secondary">{t("documents.actions.regenerate")}</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
