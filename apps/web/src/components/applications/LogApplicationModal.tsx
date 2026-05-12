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
import { useTranslation } from "@/i18n/useTranslation";

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
  fixedJobId?: string | null;
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
  const { t } = useTranslation();
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
    return [{ label: t("applications.logModal.noLinkedJob"), value: "" }, ...jobs.map((j) => ({ label: `${j.company} — ${j.position}`, value: getResourceId(j) }))];
  }, [jobs, t]);

  const sourceOptions = useMemo(() => [
    { label: t("applications.source.linkedin"), value: "LinkedIn" },
    { label: t("applications.source.indeed"), value: "Indeed" },
    { label: t("applications.source.companyWebsite"), value: "Company Website" },
    { label: t("applications.source.referral"), value: "Referral" },
    { label: t("applications.source.gmail"), value: "Gmail" },
    { label: t("applications.source.manual"), value: "Manual" },
    { label: t("applications.source.other"), value: "Other" },
  ], [t]);

  const appStatusOptions = useMemo(() => [
    { label: t("applications.applicationStatus.drafted"), value: "Drafted" },
    { label: t("applications.applicationStatus.ready"), value: "Ready" },
    { label: t("applications.applicationStatus.applied"), value: "Applied" },
    { label: t("applications.applicationStatus.followUpDue"), value: "Follow-Up Due" },
    { label: t("applications.applicationStatus.replied"), value: "Replied" },
    { label: t("applications.applicationStatus.interview"), value: "Interview" },
    { label: t("applications.applicationStatus.offer"), value: "Offer" },
    { label: t("applications.applicationStatus.rejected"), value: "Rejected" },
    { label: t("applications.applicationStatus.archived"), value: "Archived" },
  ], [t]);

  const responseOptions = useMemo(() => [
    { label: t("applications.responseStatus.awaitingResponse"), value: "No Response" },
    { label: t("applications.responseStatus.positiveReply"), value: "Positive Reply" },
    { label: t("applications.responseStatus.negativeReply"), value: "Negative Reply" },
    { label: t("applications.responseStatus.autoReply"), value: "Auto Reply" },
    { label: t("applications.responseStatus.needsReview"), value: "Needs Review" },
  ], [t]);

  const followUpOptions = useMemo(() => [
    { label: t("applications.followUpStatus.notScheduled"), value: "Not Needed" },
    { label: t("applications.followUpStatus.scheduled"), value: "Scheduled" },
    { label: t("applications.followUpStatus.dueToday"), value: "Due Today" },
    { label: t("applications.followUpStatus.overdue"), value: "Overdue" },
    { label: t("applications.followUpStatus.sent"), value: "Sent" },
  ], [t]);

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
      showError(t("applications.logModal.companyRequired"));
      return;
    }
    if (!p) {
      showError(t("applications.logModal.positionRequired"));
      return;
    }
    const u = jobUrl.trim();
    if (u && !u.startsWith("http://") && !u.startsWith("https://")) {
      showError(t("applications.logModal.invalidUrl"));
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
          {t("applications.logModal.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">{t("applications.logModal.subtitle")}</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          {showJobPicker ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.relatedJob")}</label>
              <Select value={jobId} onChange={(e) => applyJobSelection(e.target.value)} options={jobOptions} />
              {jobs.length === 0 ? (
                <p className="text-xs text-[var(--text-3)]">{t("applications.logModal.noJobsLoaded")}</p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-3)] px-3 py-2 text-xs text-[var(--text-3)]">
              {t("applications.logModal.linkedToCurrent")}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.company")}</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.position")}</label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.source")}</label>
              <Select value={source} onChange={(e) => setSource(e.target.value)} options={sourceOptions} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.appliedDate")}</label>
              <Input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.applicationStatus")}</label>
              <Select
                value={applicationStatus}
                onChange={(e) => setApplicationStatus(e.target.value as ApplicationStatus)}
                options={appStatusOptions}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.response")}</label>
              <Select
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value as ResponseStatus)}
                options={responseOptions}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.followUp")}</label>
              <Select
                value={followUpStatus}
                onChange={(e) => setFollowUpStatus(e.target.value as FollowUpStatus)}
                options={followUpOptions}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.contactEmail")}</label>
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="recruiter@company.com" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.jobUrl")}</label>
            <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("applications.logModal.notes")}</label>
            <textarea
              className="flex min-h-[88px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("applications.logModal.notesPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t("applications.logModal.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("applications.logModal.saving") : t("applications.logModal.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
