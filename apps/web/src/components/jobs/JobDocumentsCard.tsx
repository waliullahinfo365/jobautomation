"use client";

import { useState } from "react";
import type { JobDocument } from "@/types/job";
import { SectionCard } from "@/components/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FileTextIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { updateDocument } from "@/lib/api/documents.api";
import { generateDraft } from "@/lib/api/jobs.api";
import { showError, showSuccess } from "@/lib/ui/toast";

interface JobDocumentsCardProps {
  documents: JobDocument[];
  jobId?: string;
}

function documentSubtitle(doc: JobDocument): string {
  if (doc.documentKind && doc.type === "Other") {
    return `${doc.type} · ${doc.documentKind}`;
  }
  return doc.type;
}

function isCoverLetter(doc: JobDocument) {
  return doc.type === "Cover Letter" || doc.documentKind === "Cover Letter";
}

function FormattedCoverLetter({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <div className="space-y-4 font-sans text-sm leading-relaxed text-[var(--text-1)]">
      {paragraphs.map((para, i) => {
        // Treat first paragraph as salutation if short
        if (i === 0 && para.length < 60 && !para.includes(" ")) {
          return (
            <p key={i} className="font-semibold text-[var(--text-1)]">{para}</p>
          );
        }
        // Detect closing (Dear, Sincerely, Best, Regards, etc.)
        const isClosing = /^(sincerely|best regards|regards|yours truly|kind regards|thank you|warm regards)/i.test(para);
        if (isClosing) {
          return (
            <div key={i} className="mt-6 space-y-1">
              {para.split("\n").map((line, j) => (
                <p key={j} className={j === 0 ? "font-medium text-[var(--text-1)]" : "text-[var(--text-2)]"}>{line}</p>
              ))}
            </div>
          );
        }
        return (
          <p key={i} className="text-[var(--text-2)]">{para}</p>
        );
      })}
    </div>
  );
}

export function JobDocumentsCard({ documents, jobId }: JobDocumentsCardProps) {
  const { t } = useTranslation();
  const [viewDoc, setViewDoc] = useState<JobDocument | null>(null);
  const [docContent, setDocContent] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [showPromptBox, setShowPromptBox] = useState(false);
  const [contentCache, setContentCache] = useState<Record<string, string>>({});

  function openDoc(doc: JobDocument) {
    setViewDoc(doc);
    setEditMode(false);
    setCustomPrompt("");
    setShowPromptBox(false);
    const text = contentCache[doc.id] ?? doc.contentText ?? doc.contentPreview ?? "";
    setDocContent(text);
    setEditText(text);
  }

  function closeDoc() {
    setViewDoc(null);
    setEditMode(false);
    setShowPromptBox(false);
  }

  async function handleSave() {
    if (!viewDoc) return;
    setSaving(true);
    try {
      await updateDocument(viewDoc.id, { contentText: editText });
      showSuccess("Document saved");
      setDocContent(editText);
      setContentCache((c) => ({ ...c, [viewDoc.id]: editText }));
      setEditMode(false);
    } catch {
      showError("Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!jobId) return;
    setRegenerating(true);
    try {
      await generateDraft(jobId, { customPrompt: customPrompt.trim() || undefined });
      showSuccess("Regeneration queued — refresh in a moment");
      setShowPromptBox(false);
      setCustomPrompt("");
    } catch {
      showError("Failed to queue regeneration — please try again");
    } finally {
      setRegenerating(false);
    }
  }

  const docText = docContent;
  const isCL = viewDoc ? isCoverLetter(viewDoc) : false;

  return (
    <>
      <SectionCard title={t("nav.documents")}>
        {documents.length === 0 ? (
          <p className="text-sm text-[var(--text-3)]">{t("jobs.documentsCard.noneGenerated")}</p>
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
                      {t("common.open")}
                    </a>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => openDoc(doc)}>
                    {t("common.view")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        isOpen={viewDoc !== null}
        onClose={closeDoc}
        title={viewDoc?.fileName ?? "Document"}
        description={viewDoc ? documentSubtitle(viewDoc) : undefined}
        size="lg"
      >
        {viewDoc ? (
          <div className="flex flex-col gap-4">
            {/* Action bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {!editMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { setEditMode(true); setEditText(docText); }}
                >
                  ✏ Edit
                </Button>
              )}
              {jobId && !editMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowPromptBox((v) => !v)}
                >
                  ↺ Regenerate with AI
                </Button>
              )}
              {editMode && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => void handleSave()}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {/* Custom prompt input for regeneration */}
            {showPromptBox && !editMode && (
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3 space-y-2">
                <p className="text-xs font-medium text-[var(--text-2)]">
                  Give the AI new instructions (optional) — e.g. "make it more formal", "emphasise leadership experience"
                </p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Type your instructions here…"
                  rows={3}
                  className="w-full resize-none rounded-md border border-[var(--border-default)] bg-[var(--bg-1)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-4)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => void handleRegenerate()}
                    disabled={regenerating}
                  >
                    {regenerating ? "Queuing…" : "Regenerate"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => { setShowPromptBox(false); setCustomPrompt(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Document content */}
            <div className="max-h-[55vh] overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
              {editMode ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={24}
                  className="w-full resize-y rounded-md border border-[var(--border-default)] bg-[var(--bg-1)] px-3 py-2 font-sans text-sm leading-relaxed text-[var(--text-1)] placeholder:text-[var(--text-4)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : docText ? (
                isCL ? (
                  <FormattedCoverLetter text={docText} />
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--text-2)]">
                    {docText}
                  </pre>
                )
              ) : (
                <p className="text-sm text-[var(--text-3)]">{t("jobs.documentsCard.noTextContent")}</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
