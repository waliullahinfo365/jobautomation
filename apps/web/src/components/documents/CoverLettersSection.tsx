"use client";

import { useState } from "react";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/i18n/useTranslation";
import type { CoverLetterRecord } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { updateDocument } from "@/lib/api/documents.api";
import { generateDraft } from "@/lib/api/jobs.api";
import { showError, showSuccess } from "@/lib/ui/toast";

function FormattedCoverLetter({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="space-y-4 font-sans text-sm leading-relaxed text-[var(--text-1)]">
      {paragraphs.map((para, i) => {
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
        return <p key={i} className="text-[var(--text-2)]">{para}</p>;
      })}
    </div>
  );
}

export function CoverLettersSection({ records }: { records: CoverLetterRecord[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const [viewRecord, setViewRecord] = useState<CoverLetterRecord | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPromptBox, setShowPromptBox] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  function openRecord(r: CoverLetterRecord) {
    setViewRecord(r);
    setEditMode(false);
    setEditText(r.contentText ?? "");
    setCustomPrompt("");
    setShowPromptBox(false);
  }

  function closeRecord() {
    setViewRecord(null);
    setEditMode(false);
    setShowPromptBox(false);
  }

  async function handleSave() {
    if (!viewRecord) return;
    setSaving(true);
    try {
      await updateDocument(viewRecord.id, { contentText: editText });
      showSuccess("Document saved");
      setViewRecord({ ...viewRecord, contentText: editText });
      setEditMode(false);
    } catch {
      showError("Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!viewRecord?.jobId) return;
    setRegenerating(true);
    try {
      await generateDraft(viewRecord.jobId, { customPrompt: customPrompt.trim() || undefined });
      showSuccess("Regeneration queued — refresh in a moment");
      setShowPromptBox(false);
      setCustomPrompt("");
    } catch {
      showError("Failed to queue regeneration — please try again");
    } finally {
      setRegenerating(false);
    }
  }

  const docText = viewRecord?.contentText ?? "";

  return (
    <>
      <SectionCard title={t("documents.coverLetters.title")} description={t("documents.coverLetters.subtitle")} contentClassName="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("documents.coverLetters.fileName")}</TableHead>
              <TableHead>{t("documents.coverLetters.company")}</TableHead>
              <TableHead>{t("documents.coverLetters.position")}</TableHead>
              <TableHead>{t("documents.coverLetters.relatedJob")}</TableHead>
              <TableHead>{t("documents.coverLetters.status")}</TableHead>
              <TableHead>{t("documents.coverLetters.aiGenerated")}</TableHead>
              <TableHead>{t("documents.coverLetters.pdfExport")}</TableHead>
              <TableHead>{t("documents.coverLetters.lastUpdated")}</TableHead>
              <TableHead className="text-right">{t("documents.coverLetters.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.fileName}</TableCell>
                <TableCell>{r.company}</TableCell>
                <TableCell>{r.position}</TableCell>
                <TableCell>{r.relatedJob}</TableCell>
                <TableCell><DocumentStatusBadge status={r.status} /></TableCell>
                <TableCell>{r.aiGenerated ? t("documents.coverLetters.yes") : t("documents.coverLetters.no")}</TableCell>
                <TableCell><ReportStatusBadge status={r.pdfExportStatus} /></TableCell>
                <TableCell>{dateFmt.format(new Date(r.lastUpdated))}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openRecord(r)}>
                      {t("documents.actions.view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { openRecord(r); setShowPromptBox(true); }}
                    >
                      {t("documents.actions.regenerate")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <Modal
        isOpen={viewRecord !== null}
        onClose={closeRecord}
        title={viewRecord?.fileName ?? "Cover Letter"}
        description={viewRecord ? `${viewRecord.company} · ${viewRecord.position}` : undefined}
        size="lg"
      >
        {viewRecord ? (
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
              {viewRecord.jobId && !editMode && (
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
                  <Button type="button" size="sm" className="h-8 text-xs" onClick={() => void handleSave()} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditMode(false)} disabled={saving}>
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {/* Custom prompt box */}
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
                  <Button type="button" size="sm" className="h-8 text-xs" onClick={() => void handleRegenerate()} disabled={regenerating}>
                    {regenerating ? "Queuing…" : "Regenerate"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setShowPromptBox(false); setCustomPrompt(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="max-h-[55vh] overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
              {editMode ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={24}
                  className="w-full resize-y rounded-md border border-[var(--border-default)] bg-[var(--bg-1)] px-3 py-2 font-sans text-sm leading-relaxed text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : docText ? (
                <FormattedCoverLetter text={docText} />
              ) : (
                <p className="text-sm text-[var(--text-3)]">No text content available for this document.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
