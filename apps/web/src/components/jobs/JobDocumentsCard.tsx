import type { JobDocument } from "@/types/job";
import { SectionCard } from "@/components/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon } from "@/components/icons";

interface JobDocumentsCardProps {
  documents: JobDocument[];
}

export function JobDocumentsCard({ documents }: JobDocumentsCardProps) {
  return (
    <SectionCard title="Documents">
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3"
          >
            <div className="flex items-center gap-3">
              <FileTextIcon size={16} className="text-[var(--text-3)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-1)]">{doc.fileName}</p>
                <p className="text-xs text-[var(--text-3)]">{doc.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{doc.status}</Badge>
              <a
                href={doc.url}
                className="rounded-md border border-[var(--border-default)] px-2.5 py-1 text-xs font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
