"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CreateApplicationFormPayload } from "@/lib/api/applications.api";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeJobForUi, getResourceId } from "@/lib/utils/resource";
import { showError } from "@/lib/ui/toast";
import type { Job } from "@/types/job";
import type { ApplicationStatus, FollowUpStatus, ResponseStatus } from "@/types/application";

const SOURCES = [
  { label: "LinkedIn", value: "LinkedIn" },
  { label: "Indeed", value: "Indeed" },
  { label: "Company Website", value: "Company Website" },
  { label: "Referral", value: "Referral" },
  { label: "Gmail", value: "Gmail" },
  { label: "Manual", value: "Manual" },
  { label: "Other", value: "Other" },
] as const;

const APP_STATUSES: { label: string; value: ApplicationStatus }[] = [
  { label: "Drafted", value: "Drafted" },
  { label: "Ready", value: "Ready" },
  { label: "Applied", value: "Applied" },
  { label: "Follow-Up Due", value: "Follow-Up Due" },
  { label: "Replied", value: "Replied" },
  { label: "Interview", value: "Interview" },
  { label: "Offer", value: "Offer" },
  { label: "Rejected", value: "Rejected" },
  { label: "Archived", value: "Archived" },
];

const RESPONSE_STATUSES: { label: string; value: ResponseStatus }[] = [
  { label: "Awaiting response", value: "No Response" },
  { label: "Positive reply", value: "Positive Reply" },
  { label: "Negative reply", value: "Negative Reply" },
  { label: "Auto reply", value: "Auto Reply" },
  { label: "Needs review", value: "Needs Review" },
];

const FOLLOW_UP: { label: string; value: FollowUpStatus }[] = [
  { label: "Not scheduled", value: "Not Needed" },
  { label: "Scheduled", value: "Scheduled" },
  { label: "Due today", value: "Due Today" },
  { label: "Overdue", value: "Overdue" },
  { label: "Sent", value: "Sent" },
];

function todayDateInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateApplicationFormPayload) => Promise<void>;
  loading?: boolean;
  /** When set, related job is fixed and hidden from picker (job detail page). */
  fixedJobId?: string | null;
  /** Prefill when opening from a job row or detail. */
  initialJob?: Job | null;
};

export function LogApplicationModal({
  open,
  onClose,
  onSubmit,
  loading,
  fixedJobId,
  initialJob,
}: Props) {
  const jobsApi = useJobsApi({ fallbackToMock: true });
  const jobs = useMemo(() => {
    const raw = normalizeListResponse<unknown>(jobsApi.data);
    return raw.map(normalizeJobForUi);
  }, [jobsApi.data]);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobId, setJobId] = useState<string>("");
  const [source, setSource] = useState<string>("Manual");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("Applied");
  const [responseStatus, setResponseStatus] = useState<ResponseStatus>("No Response");
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>("Not Needed");
  const [appliedDate, setAppliedDate] = useState(todayDateInput);
  const [contactEmail, setContactEmail] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    const j = initialJob;
    const fixed = fixedJobId ?? (j ? getResourceId(j) : "");
    setCompany(j?.company ?? "");
    setPosition(j?.position ?? j?.title ?? "");
    setJobId(fixed || "");
    setSource(j?.source ?? "Manual");
    setApplicationStatus("Applied");
    setResponseStatus("No Response");
    setFollowUpStatus("Not Needed");
    setAppliedDate(todayDateInput());
    setContactEmail("");
    setJobUrl(j?.jobUrl ?? j?.url ?? "");
    setNotes("");
  }, [open, initialJob, fixedJobId]);

  const jobOptions = useMemo(() => {
    return [{ label: "No linked job", value: "" }, ...jobs.map((j) => ({ label: `${j.company} — ${j.position}`, value: getResourceId(j) }))];
  }, [jobs]);

  function applyJobSelection(selectedId: string) {
    setJobId(selectedId);
    if (!selectedId) return;
    const j = jobs.find((x) => getResourceId(x) === selectedId);
    if (!j) return;
    setCompany(j.company);
    setPosition(j.position || j.title);
    setSource(typeof j.source === "string" ? j.source : "Manual");
    setJobUrl(j.jobUrl || j.url || "");
  }

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = company.trim();
    const p = position.trim();
    if (!c) {
      showError("Company is required.");
      return;
    }
    if (!p) {
      showError("Position is required.");
      return;
    }
    const u = jobUrl.trim();
    if (u && !u.startsWith("http://") && !u.startsWith("https://")) {
      showError("Job URL must start with http:// or https://");
      return;
    }
    const effectiveJobId = fixedJobId?.trim() || jobId.trim() || undefined;
    await onSubmit({
      company: c,
      position: p,
      jobId: effectiveJobId,
      source,
      applicationStatus,
      responseStatus,
      followUpStatus,
      appliedDate,
      contactEmail: contactEmail.trim() || undefined,
      jobUrl: u || undefined,
      notes: notes.trim() || undefined,
    });
  }

  const showJobPicker = !fixedJobId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => !loading && onClose()} aria-hidden />
      <div
        className="relative z-50 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-app-title"
      >
        <h2 id="log-app-title" className="text-lg font-semibold tracking-tight text-[var(--text-1)]">
          Log application
        </h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">Record an application and track replies and follow-ups.</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          {showJobPicker ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Related job</label>
              <Select value={jobId} onChange={(e) => applyJobSelection(e.target.value)} options={jobOptions} />
              {jobs.length === 0 ? (
                <p className="text-xs text-[var(--text-3)]">No jobs loaded — you can still log an application without a link.</p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-3)] px-3 py-2 text-xs text-[var(--text-3)]">
              Linked to current job
            </p>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Company *</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Position *</label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Source</label>
              <Select value={source} onChange={(e) => setSource(e.target.value)} options={[...SOURCES]} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Applied date</label>
              <Input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Application status</label>
              <Select
                value={applicationStatus}
                onChange={(e) => setApplicationStatus(e.target.value as ApplicationStatus)}
                options={APP_STATUSES.map((o) => ({ label: o.label, value: o.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Response</label>
              <Select
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value as ResponseStatus)}
                options={RESPONSE_STATUSES.map((o) => ({ label: o.label, value: o.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Follow-up</label>
              <Select
                value={followUpStatus}
                onChange={(e) => setFollowUpStatus(e.target.value as FollowUpStatus)}
                options={FOLLOW_UP.map((o) => ({ label: o.label, value: o.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Contact email</label>
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="recruiter@company.com" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Job URL</label>
            <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Notes</label>
            <textarea
              className="flex min-h-[88px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cover letter sent, referral name, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Log application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
