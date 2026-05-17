"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderIcon, SparklesIcon } from "@/components/icons";
import { JobDetailHeader } from "@/components/jobs/JobDetailHeader";
import { JobOverviewCard } from "@/components/jobs/JobOverviewCard";
import { JobTimeline } from "@/components/jobs/JobTimeline";
import { JobDocumentsCard } from "@/components/jobs/JobDocumentsCard";
import { JobAutomationActivity } from "@/components/jobs/JobAutomationActivity";
import { LogApplicationModal } from "@/components/applications/LogApplicationModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionCard } from "@/components/shared/SectionCard";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { Button } from "@/components/ui/button";
import { useApplicationsApi } from "@/hooks/api/useApplicationsApi";
import { useJobDetail, useJobsApi } from "@/hooks/api/useJobsApi";
import { ApiError } from "@/lib/api/client";
import { buildCreateApplicationPayload, type CreateApplicationFormPayload } from "@/lib/api/applications.api";
import { shouldUseMockFallback } from "@/lib/api/mockFallback";
import { normalizeJobForUi } from "@/lib/utils/resource";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { mockJobs } from "@/data/mockJobs";
import { useTranslation } from "@/i18n/useTranslation";
import type { Job } from "@/types/job";

interface JobDetailPageClientProps {
  id: string;
}

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_TICKS = 12;

function profileAiContextCopy(job: Job): string | null {
  const ctx = job.profileDocumentContext;
  if (!ctx) return null;
  const { hasCvContent, hasCoverLetterContent } = ctx;
  if (hasCvContent && hasCoverLetterContent) return "Using uploaded CV and cover letter context";
  if (hasCvContent) return "Using uploaded CV context (add a workspace cover letter in Documents for style matching)";
  if (hasCoverLetterContent) return "Using uploaded cover letter as a style reference (add a CV in Documents for factual grounding)";
  return null;
}

export function JobDetailPageClient({ id }: JobDetailPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logAppOpen, setLogAppOpen] = useState(false);
  const [duplicateFollowUp, setDuplicateFollowUp] = useState<{ jobId: string; status: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mockFallbackJob = mockJobs.find((j) => j.id === id || j._id === id);

  const { data: rawJob, loading, isUsingFallback, refetch: refetchJob } = useJobDetail(id, {
    fallbackToMock: false,
    mockFallbackJob,
  });

  const jobsApi = useJobsApi();
  const applicationsApi = useApplicationsApi({ fallbackToMock: false });

  const job: Job | undefined = rawJob ? normalizeJobForUi(rawJob) : undefined;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPollingJob = useCallback(() => {
    stopPolling();
    let ticks = 0;
    pollRef.current = setInterval(() => {
      ticks += 1;
      void refetchJob();
      if (ticks >= POLL_MAX_TICKS) stopPolling();
    }, POLL_INTERVAL_MS);
  }, [refetchJob, stopPolling]);

  useEffect(() => {
    setDuplicateFollowUp(null);
    stopPolling();
  }, [id, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const withLoading = useCallback(async <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
    setActionLoading(key);
    try {
      return await fn();
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleCheckDuplicate = useCallback(async () => {
    try {
      setDuplicateFollowUp(null);
      const result = await withLoading("duplicate", () => jobsApi.checkDuplicate(id));
      if (result.status === "Duplicate" || result.status === "Possible Duplicate") {
        if (result.duplicateOfJobId) {
          setDuplicateFollowUp({ jobId: result.duplicateOfJobId, status: result.status });
          showInfo(
            `Possible duplicate (${result.status}). Match score ${Math.round(result.duplicateScore * 100)}%. Open the linked job to compare.`
          );
        } else {
          showInfo("Duplicate check flagged a possible match. See automation activity for details.");
        }
        await refetchJob();
        return;
      }
      showSuccess(t("jobDetail.toast.noDuplicate"));
      await refetchJob();
    } catch {
      showError(t("jobDetail.toast.duplicateFailed"));
    }
  }, [id, jobsApi, refetchJob, withLoading, t]);

  const handleGenerateResearch = useCallback(async () => {
    try {
      const res = await withLoading("research", () => jobsApi.generateResearch({ id, execute: false }));
      if (res.status === "skipped") {
        showInfo(res.message || t("jobDetail.toast.genericQueued"));
        return;
      }
      showSuccess(t("jobDetail.toast.researchStarted"));
      startPollingJob();
    } catch {
      showError(t("jobDetail.toast.researchFail"));
    }
  }, [id, jobsApi, startPollingJob, withLoading, t]);

  const handleGenerateDraft = useCallback(async () => {
    try {
      const res = await withLoading("draft", () => jobsApi.generateDraft({ id, execute: false }));
      if (res.status === "skipped") {
        showInfo(res.message || t("jobDetail.toast.genericQueued"));
        return;
      }
      showSuccess(t("jobDetail.toast.draftStarted"));
      startPollingJob();
    } catch {
      showError(t("jobDetail.toast.draftFail"));
    }
  }, [id, jobsApi, startPollingJob, withLoading, t]);

  const handleRunAiProcessing = useCallback(async () => {
    try {
      const res = await withLoading("ai", () => jobsApi.runAiProcessing({ id, options: { mode: "full" } }));
      if (res.status === "skipped") {
        showInfo(res.message || t("jobDetail.toast.genericQueued"));
        return;
      }
      showSuccess(t("jobDetail.toast.aiStarted"));
      startPollingJob();
    } catch {
      showError(t("jobDetail.toast.aiFail"));
    }
  }, [id, jobsApi, startPollingJob, withLoading, t]);

  const handleProvisionFolders = useCallback(async () => {
    try {
      const res = await withLoading("folders", () => jobsApi.provisionFolders({ id, execute: false }));
      if (res.status === "skipped") {
        showInfo(res.message || t("jobDetail.toast.genericQueued"));
        return;
      }
      showSuccess(t("jobDetail.toast.foldersStarted"));
      startPollingJob();
    } catch {
      showError(t("jobDetail.toast.foldersFail"));
    }
  }, [id, jobsApi, startPollingJob, withLoading, t]);

  const handleArchive = useCallback(async () => {
    try {
      await withLoading("archive", () => jobsApi.archive(id));
      showSuccess(t("jobDetail.toast.archived"));
      router.push("/jobs");
    } catch {
      showError(t("jobDetail.toast.archiveFail"));
    }
  }, [id, jobsApi, router, withLoading, t]);

  const handleAutoApply = useCallback(async () => {
    try {
      const res = await withLoading("autoApply", () => jobsApi.autoApply(id));
      const status = res && typeof res === "object" && "status" in res ? (res as { status: string }).status : null;
      const message = res && typeof res === "object" && "message" in res ? String((res as { message: unknown }).message) : null;
      if (status === "skipped") {
        showInfo(message || "Auto-apply already queued for this job.");
        return;
      }
      showSuccess("Auto-apply queued! The bot will submit your application shortly.");
      startPollingJob();
    } catch (e) {
      const msg = e != null && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : null;
      showError(msg || "Auto-apply failed. Make sure LinkedIn is connected in Integrations.");
    }
  }, [id, jobsApi, startPollingJob, withLoading]);

  const handleLogApplicationFromJob = useCallback(
    async (form: CreateApplicationFormPayload) => {
      const payload = buildCreateApplicationPayload({ ...form, jobId: form.jobId || id });
      try {
        await applicationsApi.createApplication(payload);
        showSuccess(t("jobDetail.toast.appLogged"));
        setLogAppOpen(false);
        try {
          await jobsApi.update({ id, payload: { status: "Applied" } });
        } catch {
          /* optional: job may already be Applied */
        }
        await refetchJob();
        await applicationsApi.refetch();
      } catch (e) {
        if (shouldUseMockFallback(e)) {
          showInfo(t("jobDetail.toast.offlineApp"));
          setLogAppOpen(false);
        } else {
          showError(e instanceof ApiError ? e.message : t("jobDetail.toast.appLogFail"));
        }
      }
    },
    [applicationsApi, id, jobsApi, refetchJob, t]
  );

  if (loading && !job) {
    return <LoadingState title={t("jobDetail.toast.loadingTitle")} description={t("jobDetail.toast.loadingDesc")} />;
  }

  if (!job) {
    return (
      <EmptyState
        title={t("jobDetail.toast.notFoundTitle")}
        description={t("jobDetail.toast.notFoundDesc")}
        actionLabel={t("jobDetail.backToJobs")}
        onAction={() => router.push("/jobs")}
      />
    );
  }

  const actionDisabled = actionLoading !== null;

  const actionBar = (
    <>
      {isUsingFallback && <ApiStatusIndicator usingMock />}
      <ActionButton
        label={t("jobDetail.checkDuplicate")}
        loading={actionLoading === "duplicate"}
        disabled={actionDisabled}
        onClick={handleCheckDuplicate}
        variant="outline"
      />
      <ActionButton
        label={t("jobs.generateResearch")}
        loading={actionLoading === "research"}
        disabled={actionDisabled}
        onClick={handleGenerateResearch}
        variant="outline"
      />
      <ActionButton
        label={t("jobs.generateDraft")}
        loading={actionLoading === "draft"}
        disabled={actionDisabled}
        onClick={handleGenerateDraft}
        variant="secondary"
      />
      <ActionButton
        label={t("jobDetail.runAi")}
        loading={actionLoading === "ai"}
        disabled={actionDisabled}
        onClick={handleRunAiProcessing}
      />
      <ActionButton
        label={t("jobDetail.provisionFolders")}
        loading={actionLoading === "folders"}
        disabled={actionDisabled}
        onClick={handleProvisionFolders}
        variant="outline"
      />
      <ActionButton
        label="⚡ Auto Apply"
        loading={actionLoading === "autoApply"}
        disabled={actionDisabled}
        onClick={handleAutoApply}
        variant="default"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      />
      <ActionButton
        label={t("jobDetail.logApplication")}
        loading={applicationsApi.createApplicationLoading}
        disabled={actionDisabled || applicationsApi.createApplicationLoading}
        onClick={() => setLogAppOpen(true)}
        variant="secondary"
      />
      <ActionButton
        label={t("jobs.archive")}
        loading={actionLoading === "archive"}
        disabled={actionDisabled}
        onClick={handleArchive}
        variant="outline"
        className="text-rose-600 hover:text-rose-700"
      />
    </>
  );

  const profileContextLine = profileAiContextCopy(job);

  return (
    <div className="space-y-6">
      <JobDetailHeader job={job} renderActions={actionBar} />

      {duplicateFollowUp ? (
        <div className="rounded-lg border border-[rgba(229,162,59,0.35)] bg-[var(--amber-bg)] px-4 py-3 text-sm text-[var(--text-2)]">
          <span className="font-medium text-[var(--amber)]">{duplicateFollowUp.status}:</span> a matching job may exist.{" "}
          <Link
            href={`/jobs/${duplicateFollowUp.jobId}`}
            className="font-medium text-[var(--violet)] underline underline-offset-2 hover:brightness-110"
          >
            Open matching job
          </Link>
        </div>
      ) : null}

      {job.profileDocumentContext ? (
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-3)] px-4 py-2.5 text-xs text-[var(--text-3)]">
          <SparklesIcon size={14} className="shrink-0 text-[var(--violet)]" />
          {profileContextLine ? (
            <span className="text-[var(--text-2)]">{profileContextLine}</span>
          ) : (
            <span>
              Upload a CV in{" "}
              <Link href="/documents" className="font-medium text-[var(--violet)] underline underline-offset-2">
                Documents
              </Link>{" "}
              to improve AI drafts.
            </span>
          )}
        </div>
      ) : null}

      <LogApplicationModal
        open={logAppOpen}
        onClose={() => setLogAppOpen(false)}
        onSubmit={handleLogApplicationFromJob}
        loading={applicationsApi.createApplicationLoading}
        fixedJobId={id}
        initialJob={job}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <JobOverviewCard job={job} />

          <SectionCard title="Application Materials">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-[var(--text-3)]">Source CV used</p>
                <p className="mt-1 text-[var(--text-1)] break-words">{job.sourceCvFileName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-3)]">Template used</p>
                <p className="mt-1 text-[var(--text-1)] break-words">{job.coverLetterTemplateFileName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-3)]">Generated cover letter</p>
                {job.generatedCoverLetterLink ? (
                  <a className="mt-1 inline-flex text-[var(--violet)] underline underline-offset-2" href={job.generatedCoverLetterLink} target="_blank" rel="noreferrer">
                    Open cover letter
                  </a>
                ) : (
                  <p className="mt-1 text-[var(--text-1)]">—</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-3)]">Research document</p>
                {job.researchDocumentLink ? (
                  <a className="mt-1 inline-flex text-[var(--violet)] underline underline-offset-2" href={job.researchDocumentLink} target="_blank" rel="noreferrer">
                    Open research
                  </a>
                ) : (
                  <p className="mt-1 text-[var(--text-1)]">—</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t("jobDetail.description")}>
            <p className="text-sm leading-6 text-[var(--text-2)] whitespace-pre-wrap break-words overflow-hidden">{job.description}</p>
            {job.aiSummary && (
              <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <SparklesIcon size={16} className="text-[var(--violet)]" />
                  <p className="text-sm font-medium text-purple-800">{t("jobDetail.aiSummary")}</p>
                </div>
                <p className="text-sm text-purple-700">{job.aiSummary}</p>
              </div>
            )}
          </SectionCard>

          <JobTimeline timeline={job.timeline} />
        </div>

        <div className="space-y-6">
          <JobDocumentsCard documents={job.documents} />
          <JobAutomationActivity logs={job.automationLogs} />
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}

function ActionButton({ label, loading, disabled, onClick, variant = "default", className }: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      disabled={disabled}
      onClick={() => { void Promise.resolve(onClick()).catch(() => void 0); }}
      className={className}
    >
      {loading && <LoaderIcon size={14} className="mr-2" />}
      {label}
    </Button>
  );
}
