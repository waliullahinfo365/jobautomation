"use client";

import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "@/i18n/useTranslation";
import type { FolderActivityRecord } from "@/types/document";
import { Badge } from "@/components/ui/badge";

const ACTION_KEY: Record<string, string> = {
  "Created folder structure": "documents.folderAction.createdFolderStructure",
  "Moved CV to Ready folder": "documents.folderAction.movedCvToReadyFolder",
  "Export batch failed": "documents.folderAction.exportBatchFailed",
  "Daily digest exported": "documents.folderAction.dailyDigestExported",
  "Research doc export flagged": "documents.folderAction.researchDocExportFlagged",
};

const STATUS_KEY: Record<string, string> = {
  Success: "documents.folderStatus.success",
  Failed: "documents.folderStatus.failed",
  Warning: "documents.folderStatus.warning",
};

export function FolderActivityTable({ records }: { records: FolderActivityRecord[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const timeFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <SectionCard title={t("documents.folderAutomation.recentActivity")} contentClassName="p-0">
      <div className="grid gap-3 p-4 md:hidden">
        {records.map((r) => (
          <article key={r.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-[var(--text-4)]">{timeFmt.format(new Date(r.time))}</span>
              <Badge variant={r.status === "Success" ? "success" : r.status === "Warning" ? "warning" : "danger"}>
                {t(STATUS_KEY[r.status] ?? r.status)}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-medium text-[var(--text-1)]">{r.job}</p>
            <p className="mt-1 text-sm text-[var(--text-2)]">{t(ACTION_KEY[r.action] ?? r.action)}</p>
            {r.folderPath ? <p className="mt-2 truncate text-xs text-[var(--text-3)]">{r.folderPath}</p> : null}
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("documents.folderAutomation.time")}</TableHead>
            <TableHead>{t("documents.folderAutomation.job")}</TableHead>
            <TableHead>{t("documents.folderAutomation.action")}</TableHead>
            <TableHead>{t("documents.folderAutomation.folderPath")}</TableHead>
            <TableHead>{t("documents.folderAutomation.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{timeFmt.format(new Date(r.time))}</TableCell>
              <TableCell>{r.job}</TableCell>
              <TableCell>{t(ACTION_KEY[r.action] ?? r.action)}</TableCell>
              <TableCell className="max-w-xs truncate text-[var(--text-2)]">{r.folderPath}</TableCell>
              <TableCell>
                <Badge variant={r.status === "Success" ? "success" : r.status === "Warning" ? "warning" : "danger"}>{t(STATUS_KEY[r.status] ?? r.status)}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </SectionCard>
  );
}
