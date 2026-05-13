"use client";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import { useTranslation } from "@/i18n/useTranslation";
import type { DocumentRecord } from "@/types/document";

export function AllDocumentsTable({
  records,
  onExportPdf,
  onRouteCv,
  onOpenFolder,
  onSetActive,
}: {
  records: DocumentRecord[];
  onExportPdf?: (record: DocumentRecord) => void | Promise<void>;
  onRouteCv?: (record: DocumentRecord) => void | Promise<void>;
  onOpenFolder?: (record: DocumentRecord) => void | Promise<void>;
  onSetActive?: (record: DocumentRecord) => void | Promise<void>;
}) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <SectionCard title={t("documents.all.title")} description={t("documents.all.subtitle")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("documents.table.fileName")}</TableHead>
            <TableHead>{t("documents.table.type")}</TableHead>
            <TableHead>{t("documents.table.relatedJob")}</TableHead>
            <TableHead>{t("documents.table.company")}</TableHead>
            <TableHead>{t("documents.table.status")}</TableHead>
            <TableHead>{t("documents.table.storageLocation")}</TableHead>
            <TableHead>{t("documents.table.lastUpdated")}</TableHead>
            <TableHead className="text-right">{t("documents.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.fileName}</TableCell>
              <TableCell>
                <DocumentTypeBadge type={record.type} />
              </TableCell>
              <TableCell>{record.relatedJob}</TableCell>
              <TableCell>{record.company}</TableCell>
              <TableCell>
                <DocumentStatusBadge status={record.status} />
              </TableCell>
              <TableCell className="max-w-xs truncate text-[var(--text-2)]">{record.storageLocation}</TableCell>
              <TableCell>{dateFmt.format(new Date(record.lastUpdated))}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="outline" type="button">
                    {t("documents.actions.view")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => void onExportPdf?.(record)}
                  >
                    {t("documents.actions.exportPdf")}
                  </Button>
                  {record.type === "CV" ? (
                    <Button size="sm" variant="outline" type="button" onClick={() => void onRouteCv?.(record)}>
                      {t("documents.actions.routeCv")}
                    </Button>
                  ) : null}
                  {record.type === "CV" || record.type === "Cover Letter Template" ? (
                    <Button size="sm" variant="outline" type="button" onClick={() => void onSetActive?.(record)}>
                      {record.isActiveProfileDocument ? "Active" : "Set as Active"}
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" type="button" onClick={() => void onOpenFolder?.(record)}>
                    {t("documents.actions.openFolder")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
