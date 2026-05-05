"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { getResourceId, normalizeJobForUi } from "@/lib/utils/resource";
import { showError } from "@/lib/ui/toast";

export type UploadPayload = {
  fileName: string;
  type: "CV" | "Cover Letter" | "Research" | "Portfolio" | "Other";
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

const TYPE_OPTIONS: { label: string; value: UploadPayload["type"] }[] = [
  { label: "CV / Resume", value: "CV" },
  { label: "Cover Letter", value: "Cover Letter" },
  { label: "Portfolio", value: "Portfolio" },
  { label: "Research", value: "Research" },
  { label: "Other", value: "Other" },
];

export function UploadDocumentModal({ open, onClose, onSubmit, loading }: Props) {
  const jobsApi = useJobsApi({ fallbackToMock: true });
  const jobs = useMemo(() => normalizeListResponse<unknown>(jobsApi.data).map(normalizeJobForUi), [jobsApi.data]);

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
      showError("Select a file first.");
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

  const jobOptions = [{ label: "Workspace library (no job) — for AI profile context", value: "" }, ...jobs.map((j) => ({ label: `${j.company} — ${j.position}`, value: getResourceId(j) }))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => !loading && onClose()} aria-hidden />
      <div className="relative z-50 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--text-1)]">Upload document</h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">
          Workspace CV and cover letter (no related job) are reused for AI research, drafts, and job analysis.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">File</label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Document type</label>
            <Select value={type} onChange={(e) => setType(e.target.value as UploadPayload["type"])} options={TYPE_OPTIONS} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Related job</label>
            <Select value={jobId} onChange={(e) => setJobId(e.target.value)} options={jobOptions} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Document text (optional, recommended for AI)</label>
            <textarea
              className="flex min-h-[120px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Paste resume or cover letter text so automations can use it. Binary files alone are not parsed yet."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Notes</label>
            <textarea
              className="flex min-h-[88px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context for this document record"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Document Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
