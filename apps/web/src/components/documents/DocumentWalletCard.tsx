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

/** Prefer company/role; strip legacy "Drive folder (pending):" prefixes. */
function docTitle(record: DocumentRecord): string {
  const company = record.company?.trim();
  const position = record.position?.trim();
  if (company && position) return `${company} — ${position}`;
  if (company) return company;
  if (record.relatedJob?.trim()) return record.relatedJob.trim();

  let name = (record.fileName || "Document").trim();
  name = name.replace(/^Drive folder\s*\([^)]*\)\s*:\s*/i, "");
  name = name.replace(/^Drive folder\s*:\s*/i, "");
  return name || "Document";
}

function docSubtitle(record: DocumentRecord): string | null {
  const title = docTitle(record);
  const raw = (record.fileName || "").trim().replace(/^Drive folder\s*\([^)]*\)\s*:\s*/i, "");
  if (!raw || raw === title) return null;
  if (title.includes(raw) || raw.includes(title.split(" — ")[0] ?? "")) return null;
  return raw;
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
  const title = docTitle(record);
  const subtitle = docSubtitle(record);

  return (
    <article
      className={cn(
        "mobile-list-card rounded-2xl border p-3 sm:p-3.5",
        highlight
          ? "border-[var(--accent-ring)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)]"
          : "border-[var(--border-default)] bg-[var(--surface-1)]"
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-[var(--accent-bg)] text-[var(--accent-hi)]" : "bg-[var(--surface-3)] text-[var(--text-2)]"
          )}
        >
          <DocumentsIcon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 break-words text-[14px] font-semibold leading-snug text-[var(--text-1)] sm:text-[15px]">
              {title}
            </h3>
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                healthy ? "bg-[var(--emerald-bg)] text-[var(--emerald)]" : "bg-[var(--amber-bg)] text-[var(--amber)]"
              )}
              title={healthy ? t("documents.simple.statusReady") : t("documents.simple.statusNeedsAttention")}
            >
              <CheckIcon size={12} className={healthy ? "" : "opacity-40"} />
            </span>
          </div>
          {subtitle ? (
            <p className="mt-1 break-words text-[12px] leading-snug text-[var(--text-4)]">{subtitle}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <DocumentTypeBadge type={record.type} />
            <span className="text-[11px] text-[var(--text-4)] sm:text-[12px]">
              {t("documents.simple.updated")} {dateFmt.format(new Date(record.lastUpdated))}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpen(record)}
          className="min-h-[44px] rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--surface-3)]"
        >
          {t("documents.simple.open")}
        </button>
        <button
          type="button"
          onClick={() => onReplace(record)}
          className="min-h-[44px] rounded-xl border border-[var(--accent-ring)] bg-[var(--accent-bg)] px-3 text-[13px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--accent-ring)]"
        >
          {t("documents.simple.replace")}
        </button>
      </div>
    </article>
  );
}
