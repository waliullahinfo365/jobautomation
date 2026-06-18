"use client";

import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import { useTranslation } from "@/i18n/useTranslation";
import type { DocumentRecord } from "@/types/document";

interface DocumentCardProps {
  record: DocumentRecord;
  onView: (record: DocumentRecord) => void;
  onExportPdf?: (record: DocumentRecord) => void | Promise<void>;
  onRouteCv?: (record: DocumentRecord) => void | Promise<void>;
  onOpenFolder?: (record: DocumentRecord) => void | Promise<void>;
  onSetActive?: (record: DocumentRecord) => void | Promise<void>;
}

export function DocumentCard({
  record,
  onView,
  onExportPdf,
  onRouteCv,
  onOpenFolder,
  onSetActive,
}: DocumentCardProps) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric" });

  return (
    <article className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[var(--text-1)]">{record.fileName}</h3>
          <p className="mt-0.5 truncate text-xs text-[var(--text-3)]">
            {[record.company, record.relatedJob].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <DocumentTypeBadge type={record.type} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-4)]">
        <DocumentStatusBadge status={record.status} />
        <span>{dateFmt.format(new Date(record.lastUpdated))}</span>
        {record.isActiveProfileDocument ? (
          <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-hi)]">
            Active
          </span>
        ) : null}
      </div>

      {record.storageLocation ? (
        <p className="mt-2 truncate text-xs text-[var(--text-3)]">{record.storageLocation}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="lg" className="min-h-[44px] w-full" onClick={() => onView(record)}>
          {t("documents.actions.view")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="min-h-[44px] w-full"
          onClick={() => void onExportPdf?.(record)}
        >
          {t("documents.actions.exportPdf")}
        </Button>
        {record.type === "CV" ? (
          <Button type="button" variant="outline" size="lg" className="min-h-[44px] w-full" onClick={() => void onRouteCv?.(record)}>
            {t("documents.actions.routeCv")}
          </Button>
        ) : null}
        {record.type === "CV" || record.type === "Cover Letter Template" ? (
          <Button type="button" variant="outline" size="lg" className="min-h-[44px] w-full" onClick={() => void onSetActive?.(record)}>
            {record.isActiveProfileDocument ? "Active" : "Set as Active"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="min-h-[44px] w-full col-span-2"
          onClick={() => void onOpenFolder?.(record)}
        >
          {t("documents.actions.openFolder")}
        </Button>
      </div>
    </article>
  );
}
