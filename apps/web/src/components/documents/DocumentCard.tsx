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

  const secondaryActions = [
    onExportPdf
      ? {
          key: "export",
          label: t("documents.actions.exportPdf"),
          onClick: () => void onExportPdf(record),
          variant: "secondary" as const,
        }
      : null,
    record.type === "CV" && onRouteCv
      ? {
          key: "route",
          label: t("documents.actions.routeCv"),
          onClick: () => void onRouteCv(record),
          variant: "outline" as const,
        }
      : null,
    (record.type === "CV" || record.type === "Cover Letter Template") && onSetActive
      ? {
          key: "active",
          label: record.isActiveProfileDocument ? "Active" : "Set as Active",
          onClick: () => void onSetActive(record),
          variant: "outline" as const,
        }
      : null,
    onOpenFolder
      ? {
          key: "folder",
          label: t("documents.actions.openFolder"),
          onClick: () => void onOpenFolder(record),
          variant: "ghost" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    onClick: () => void;
    variant: "secondary" | "outline" | "ghost";
  }>;

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-1)]">{record.fileName}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-3)]">
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
        <p className="mt-2 break-all text-xs leading-relaxed text-[var(--text-3)]">{record.storageLocation}</p>
      ) : null}

      <div className="mt-4 flex min-w-0 flex-col gap-2">
        <Button type="button" variant="outline" size="lg" className="h-11 min-h-[44px] w-full min-w-0" onClick={() => onView(record)}>
          {t("documents.actions.view")}
        </Button>
        {secondaryActions.map((action) => (
          <Button
            key={action.key}
            type="button"
            variant={action.variant}
            size="lg"
            className="h-11 min-h-[44px] w-full min-w-0 whitespace-normal text-center leading-tight"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </article>
  );
}
