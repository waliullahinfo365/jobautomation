"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import type { DocumentTab } from "@/types/document";

const tabKeys: { key: DocumentTab; i18n: string }[] = [
  { key: "All Documents", i18n: "documents.tabs.allDocuments" },
  { key: "CV Library", i18n: "documents.tabs.cvLibrary" },
  { key: "Cover Letters", i18n: "documents.tabs.coverLetters" },
  { key: "Research Docs", i18n: "documents.tabs.researchDocs" },
  { key: "PDF Exports", i18n: "documents.tabs.pdfExports" },
  { key: "Folder Automation", i18n: "documents.tabs.folderAutomation" },
];

export function DocumentTabs({ value, onChange }: { value: DocumentTab; onChange: (tab: DocumentTab) => void }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center rounded-lg bg-[var(--surface-3)] p-1">
      {tabKeys.map(({ key, i18n }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            value === key ? "bg-[var(--surface-2)] text-[var(--text-1)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text-1)]"
          )}
        >
          {t(i18n)}
        </button>
      ))}
    </div>
  );
}
