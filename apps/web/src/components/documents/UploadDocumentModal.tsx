"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { getResourceId, normalizeJobForUi } from "@/lib/utils/resource";
import { showError } from "@/lib/ui/toast";

export type UploadPayload = {
  fileName: string;
  type: "CV" | "Cover Letter" | "Cover Letter Template" | "Research" | "Supporting Document" | "Portfolio" | "Other";
  jobId?: string;
  contentText?: string;
  notes?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: UploadPayload) => Promise<void>;
  loading?: boolean;
};

export function UploadDocumentModal({ open, onClose, onSubmit, loading }: Props) {
  const { t } = useTranslation();
  const jobsApi = useJobsApi({ fallbackToMock: false });
  const jobs = useMemo(() => normalizeListResponse<unknown>(jobsApi.data).map(normalizeJobForUi), [jobsApi.data]);

  const typeOptions: { label: string; value: UploadPayload["type"] }[] = useMemo(
    () => [
      { label: t("documents.upload.cvResume"), value: "CV" },
      { label: t("documents.documentType.coverLetterTemplate"), value: "Cover Letter Template" },
      { label: t("documents.documentType.supportingDocument"), value: "Supporting Document" },
      { label: t("documents.folderTree.research"), value: "Research" },
      { label: t("documents.upload.other"), value: "Other" },
    ],
    [t],
  );

  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<UploadPayload["type"]>("CV");
  const [jobId, setJobId] = useState("");
  const [contentText, setContentText] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setType("CV");
    setJobId("");
    setContentText("");
    setNotes("");
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fileName = file?.name?.trim();
    if (!fileName) {
      showError(t("documents.upload.selectFileFirst"));
      return;
    }
    let extracted = "";
    if (file) {
      try {
        const { extractTextFromUpload } = await import("@/lib/documents/extractUploadText");
        extracted = await extractTextFromUpload(file);
      } catch {
        extracted = "";
      }
    }
    const manual = contentText.trim();
    const merged = [manual, extracted].filter(Boolean).join("\n\n---\n\n");
    if (!merged) {
      showError(t("documents.upload.noExtractableText"));
      return;
    }
    await onSubmit({
      fileName,
      type,
      jobId: jobId.trim() || undefined,
      contentText: merged,
      notes: notes.trim() || undefined,
    });
    setFile(null);
    setType("CV");
    setJobId("");
    setContentText("");
    setNotes("");
  }

  const jobOptions = [
    { label: t("documents.upload.workspaceLibrary"), value: "" },
    ...jobs.map((j) => ({ label: `${j.company} — ${j.position}`, value: getResourceId(j) })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-y-contain p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => !loading && onClose()} aria-hidden />
      <div className="relative z-50 my-auto flex max-h-[min(100dvh-1.25rem,90vh)] w-full min-w-0 max-w-lg flex-col overflow-y-auto rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 shadow-xl sm:rounded-[var(--r-lg)] sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text-1)]">{t("documents.upload.title")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-3)]">{t("documents.upload.subtitle")}</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("documents.upload.file")}</label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("documents.upload.documentType")}</label>
            <Select value={type} onChange={(e) => setType(e.target.value as UploadPayload["type"])} options={typeOptions} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("documents.upload.documentText")}</label>
            <p className="text-xs leading-relaxed text-[var(--text-3)]">{t("documents.upload.documentTextHelp")}</p>
            <textarea
              className="flex min-h-[120px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder={t("documents.upload.documentTextPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("documents.upload.notes")}</label>
            <textarea
              className="flex min-h-[88px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("documents.upload.notesPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("documents.upload.relatedJob")}</label>
            <p className="text-xs leading-relaxed text-[var(--text-3)]">{t("documents.upload.relatedJobHint")}</p>
            <Select value={jobId} onChange={(e) => setJobId(e.target.value)} options={jobOptions} />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full touch-manipulation sm:w-auto">
              {t("documents.upload.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="w-full touch-manipulation sm:w-auto">
              {loading ? t("documents.upload.creating") : t("documents.upload.createRecord")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
