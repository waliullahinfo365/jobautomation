"use client";

import { useState } from "react";
import type { JobDocument } from "@/types/job";
import { SectionCard } from "@/components/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FileTextIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

interface JobDocumentsCardProps {
  documents: JobDocument[];
}

function documentSubtitle(doc: JobDocument): string {
  if (doc.documentKind && doc.type === "Other") {
    return `${doc.type} · ${doc.documentKind}`;
  }
  return doc.type;
}

export function JobDocumentsCard({ documents }: JobDocumentsCardProps) {
  const [viewDoc, setViewDoc] = useState<JobDocument | null>(null);

  return (
    <>
      <SectionCard title="Documents">
        {documents.length === 0 ? (
          <p className="text-sm text-[var(--text-3)]">No documents generated yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileTextIcon size={16} className="shrink-0 text-[var(--text-3)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-1)]">{doc.fileName}</p>
                    <p className="text-xs text-[var(--text-3)]">
                      {documentSubtitle(doc)}
                      {doc.createdAt ? ` · ${formatDate(doc.createdAt, "MMM d, yyyy")}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{doc.status}</Badge>
                  {doc.googleDocUrl ? (
                    <a
                      href={doc.googleDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-[var(--border-default)] px-2.5 py-1 text-xs font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                    >
                      Google Doc
                    </a>
                  ) : null}
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-[var(--border-default)] px-2.5 py-1 text-xs font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                    >
                      Open
                    </a>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setViewDoc(doc)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        isOpen={viewDoc !== null}
        onClose={() => setViewDoc(null)}
        title={viewDoc?.fileName ?? "Document"}
        description={viewDoc ? documentSubtitle(viewDoc) : undefined}
        size="lg"
      >
        {viewDoc ? (
          <div className="max-h-[60vh] overflow-auto">
            {viewDoc.contentText ? (
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--text-2)]">
                {viewDoc.contentText}
              </pre>
            ) : viewDoc.contentPreview ? (
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--text-2)]">
                {viewDoc.contentPreview}
                …
              </pre>
            ) : (
              <p className="text-sm text-[var(--text-3)]">No text content is available for this document.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
