"use client";

import { useState } from "react";
import { SectionCard } from "@/components/shared/SectionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/i18n/useTranslation";
import type { ResearchDocumentRecord } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { updateDocument, getDocument } from "@/lib/api/documents.api";
import { generateResearch } from "@/lib/api/jobs.api";
import { showError, showSuccess } from "@/lib/ui/toast";

export function ResearchDocsSection({ records }: { records: ResearchDocumentRecord[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const [viewRecord, setViewRecord] = useState<ResearchDocumentRecord | null>(null);
  const [docContent, setDocContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [contentCache, setContentCache] = useState<Record<string, string>>({});

  async function openRecord(r: ResearchDocumentRecord) {
    setViewRecord(r);
    setEditMode(false);
    const cached = contentCache[r.id] ?? r.contentText ?? "";
    setDocContent(cached);
    setEditText(cached);

    setLoading(true);
    try {
      const full = await getDocument(r.id);
      const text = (full as unknown as Record<string, unknown>).contentText as string ?? "";
      setDocContent(text);
      setEditText(text);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!viewRecord) return;
    setSaving(true);
    try {
      await updateDocument(viewRecord.id, { contentText: editText });
      showSuccess("Research document saved");
      setDocContent(editText);
      setContentCache((c) => ({ ...c, [viewRecord.id]: editText }));
      setEditMode(false);
    } catch {
      showError("Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(r: ResearchDocumentRecord) {
    if (!r.jobId) {
      showError("This document is not linked to a job — cannot re-run research");
      return;
    }
    setUpdating(r.id);
    try {
      await generateResearch(r.jobId);
      showSuccess("Research update queued — refresh in a moment to see the new version");
    } catch {
      showError("Failed to queue research update — please try again");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <>
      <SectionCard title={t("documents.research.title")} description={t("documents.research.subtitle")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {records.map((r) => (
            <Card key={r.id} className="min-w-0 overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-medium leading-snug text-[var(--text-1)]">{r.documentName}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-3)]">{r.company} · {r.position}</p>
                  </div>
                  <DocumentStatusBadge status={r.researchStatus} />
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-2)]">{r.aiSummarySnippet}</p>
                <p className="text-xs text-[var(--text-3)]">{t("documents.research.created")} {dateFmt.format(new Date(r.createdAt))}</p>
                <div className="mobile-card-actions">
                  <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => void openRecord(r)}>
                    {t("documents.actions.viewResearch")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-[44px]"
                    disabled={updating === r.id}
                    onClick={() => void handleUpdate(r)}
                  >
                    {updating === r.id ? "Queuing…" : t("documents.actions.update")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionCard>

      <Modal
        isOpen={viewRecord !== null}
        onClose={() => { setViewRecord(null); setEditMode(false); }}
        title={viewRecord?.documentName ?? "Research Document"}
        description={viewRecord ? `${viewRecord.company} · ${viewRecord.position}` : undefined}
        size="lg"
      >
        {viewRecord ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {!editMode ? (
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs"
                  onClick={() => { setEditMode(true); setEditText(docContent); }}>
                  ✏ Edit
                </Button>
              ) : (
                <>
                  <Button type="button" size="sm" className="h-8 text-xs"
                    onClick={() => void handleSave()} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs"
                    onClick={() => setEditMode(false)} disabled={saving}>
                    Cancel
                  </Button>
                </>
              )}
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 w-2/3 rounded bg-[var(--surface-2)]" />
                  <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
                  <div className="h-3 w-5/6 rounded bg-[var(--surface-2)]" />
                  <div className="h-3 w-3/4 rounded bg-[var(--surface-2)]" />
                </div>
              ) : editMode ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={24}
                  className="w-full resize-y rounded-md border border-[var(--border-default)] bg-[var(--bg-1)] px-3 py-2 font-sans text-sm leading-relaxed text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : docContent ? (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--text-2)]">
                  {docContent}
                </pre>
              ) : (
                <p className="text-sm text-[var(--text-3)]">No content available for this document.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
