"use client";

import { useMemo, useState } from "react";
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
  const jobsApi = useJobsApi({ fallbackToMock: true });
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

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fileName = file?.name?.trim();
    if (!fileName) {
      showError(t("documents.upload.selectFileFirst"));
      return;
    }
    await onSubmit({
      fileName,
      type,
      jobId: jobId || undefined,
      contentText: contentText.trim() || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => !loading && onClose()} aria-hidden />
      <div className="relative z-50 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--text-1)]">{t("documents.upload.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">{t("documents.upload.subtitle")}</p>
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
            <label className="text-xs font-medium text-[var(--text-3)]">{t("documents.upload.relatedJob")}</label>
            <Select value={jobId} onChange={(e) => setJobId(e.target.value)} options={jobOptions} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("documents.upload.documentText")}</label>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t("documents.upload.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("documents.upload.creating") : t("documents.upload.createRecord")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
