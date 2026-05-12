import { ExternalLinkIcon, FileTextIcon } from "@/components/icons";
import type { Document } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { formatDate } from "@/lib/utils";
import { SectionCard } from "@/components/shared/SectionCard";
import { useTranslation } from "@/i18n/useTranslation";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const { t } = useTranslation();

  return (
    <SectionCard title={t("section.documentList")} contentClassName="p-0">
      <div className="divide-y divide-[var(--border-default)]">
        {documents.map((doc) => (
          <div key={doc._id} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)]/80">
            <div className="flex min-w-0 items-center gap-3">
              <FileTextIcon size={16} className="shrink-0 text-[var(--text-3)]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-1)]">{doc.name}</p>
                <p className="text-xs text-[var(--text-3)]">{doc.type} · v{doc.version} · {formatDate(doc.updatedAt)}</p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-3">
              <DocumentStatusBadge status={doc.status} />
              {doc.driveUrl && (
                <a href={doc.driveUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:opacity-70">
                  <ExternalLinkIcon size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
