"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import { useTranslation } from "@/i18n/useTranslation";
import type { DocumentRecord } from "@/types/document";
import { updateDocument, getDocument } from "@/lib/api/documents.api";
import { showError, showSuccess } from "@/lib/ui/toast";

export function AllDocumentsTable({
  records,
  onExportPdf,
  onRouteCv,
  onOpenFolder,
  onSetActive,
}: {
  records: DocumentRecord[];
  onExportPdf?: (record: DocumentRecord) => void | Promise<void>;
  onRouteCv?: (record: DocumentRecord) => void | Promise<void>;
  onOpenFolder?: (record: DocumentRecord) => void | Promise<void>;
  onSetActive?: (record: DocumentRecord) => void | Promise<void>;
}) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const [viewRecord, setViewRecord] = useState<DocumentRecord | null>(null);
  const [docContent, setDocContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [contentCache, setContentCache] = useState<Record<string, string>>({});

  async function openRecord(r: DocumentRecord) {
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
      // silently ignore — modal still shows cached content
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!viewRecord) return;
    setSaving(true);
    try {
      await updateDocument(viewRecord.id, { contentText: editText });
      showSuccess("Document saved");
      setDocContent(editText);
      setContentCache((c) => ({ ...c, [viewRecord.id]: editText }));
      setEditMode(false);
    } catch {
      showError("Failed to save — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionCard title={t("documents.all.title")} description={t("documents.all.subtitle")} contentClassName="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("documents.table.fileName")}</TableHead>
              <TableHead>{t("documents.table.type")}</TableHead>
              <TableHead>{t("documents.table.relatedJob")}</TableHead>
              <TableHead>{t("documents.table.company")}</TableHead>
              <TableHead>{t("documents.table.status")}</TableHead>
              <TableHead>{t("documents.table.storageLocation")}</TableHead>
              <TableHead>{t("documents.table.lastUpdated")}</TableHead>
              <TableHead className="text-right">{t("documents.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.fileName}</TableCell>
                <TableCell>
                  <DocumentTypeBadge type={record.type} />
                </TableCell>
                <TableCell>{record.relatedJob}</TableCell>
                <TableCell>{record.company}</TableCell>
                <TableCell>
                  <DocumentStatusBadge status={record.status} />
                </TableCell>
                <TableCell className="max-w-xs truncate text-[var(--text-2)]">{record.storageLocation}</TableCell>
                <TableCell>{dateFmt.format(new Date(record.lastUpdated))}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" type="button" onClick={() => void openRecord(record)}>
                      {t("documents.actions.view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={() => void onExportPdf?.(record)}
                    >
                      {t("documents.actions.exportPdf")}
                    </Button>
                    {record.type === "CV" ? (
                      <Button size="sm" variant="outline" type="button" onClick={() => void onRouteCv?.(record)}>
                        {t("documents.actions.routeCv")}
                      </Button>
                    ) : null}
                    {record.type === "CV" || record.type === "Cover Letter Template" ? (
                      <Button size="sm" variant="outline" type="button" onClick={() => void onSetActive?.(record)}>
                        {record.isActiveProfileDocument ? "Active" : "Set as Active"}
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" type="button" onClick={() => void onOpenFolder?.(record)}>
                      {t("documents.actions.openFolder")}
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
        onClose={() => { setViewRecord(null); setEditMode(false); }}
        title={viewRecord?.fileName ?? "Document"}
        description={viewRecord ? `${viewRecord.type}${viewRecord.company ? ` · ${viewRecord.company}` : ""}` : undefined}
        size="lg"
      >
        {viewRecord ? (
          <div className="flex flex-col gap-4">
            {/* Action bar */}
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
              {viewRecord.storageUrl && (
                <a href={viewRecord.storageUrl} target="_blank" rel="noreferrer">
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                    Open ↗
                  </Button>
                </a>
              )}
            </div>

            {/* Content */}
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
                <p className="text-sm text-[var(--text-3)]">No text content available for this document.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
