"use client";

import { DocumentsIcon } from "@/components/icons";
import { CheckIcon } from "@/components/icons/moreIcons";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import { useTranslation } from "@/i18n/useTranslation";
import type { DocumentRecord, DocumentStatus } from "@/types/document";
import { cn } from "@/lib/utils";

function isHealthyStatus(status: DocumentStatus): boolean {
  return status === "Ready" || status === "Exported";
}

export function DocumentWalletCard({
  record,
  onOpen,
  onReplace,
  highlight,
}: {
  record: DocumentRecord;
  onOpen: (record: DocumentRecord) => void;
  onReplace: (record: DocumentRecord) => void;
  highlight?: boolean;
}) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric" });
  const healthy = isHealthyStatus(record.status);

  return (
    <article
      className={cn(
        "flex min-w-0 gap-3 rounded-2xl border p-4 shadow-sm",
        highlight
          ? "border-[var(--accent-ring)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)]"
          : "border-[var(--border-default)] bg-[var(--surface-1)]"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          highlight ? "bg-[var(--accent-bg)] text-[var(--accent-hi)]" : "bg-[var(--surface-3)] text-[var(--text-2)]"
        )}
      >
        <DocumentsIcon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--text-1)]">{record.fileName}</h3>
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              healthy ? "bg-[var(--emerald-bg)] text-[var(--emerald)]" : "bg-[var(--amber-bg)] text-[var(--amber)]"
            )}
            title={healthy ? t("documents.simple.statusReady") : t("documents.simple.statusNeedsAttention")}
          >
            <CheckIcon size={14} className={healthy ? "" : "opacity-40"} />
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DocumentTypeBadge type={record.type} />
          <span className="text-[12px] text-[var(--text-4)]">
            {t("documents.simple.updated")} {dateFmt.format(new Date(record.lastUpdated))}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onOpen(record)}
            className="min-h-[44px] flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--surface-3)]"
          >
            {t("documents.simple.open")}
          </button>
          <button
            type="button"
            onClick={() => onReplace(record)}
            className="min-h-[44px] flex-1 rounded-xl bg-[var(--accent-bg)] px-3 text-[13px] font-semibold text-[var(--accent-hi)] transition-colors hover:bg-[var(--accent-ring)]"
          >
            {t("documents.simple.replace")}
          </button>
        </div>
      </div>
    </article>
  );
}
