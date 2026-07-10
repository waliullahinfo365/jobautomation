"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderIcon } from "@/components/icons";
import { JobDetailAdvancedView } from "@/components/jobs/JobDetailAdvancedView";
import { JobDetailSimpleView } from "@/components/jobs/JobDetailSimpleView";
import { shouldShowApplyStickyBar } from "@/components/jobs/ApplyStickyBar";
import { LogApplicationModal } from "@/components/applications/LogApplicationModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { Button } from "@/components/ui/button";
import { useAdvancedUi } from "@/context/AuthSessionContext";
import { useApplicationsApi } from "@/hooks/api/useApplicationsApi";
import { useJobDetail, useJobsApi } from "@/hooks/api/useJobsApi";
import { ApiError } from "@/lib/api/client";
import { buildCreateApplicationPayload, type CreateApplicationFormPayload } from "@/lib/api/applications.api";
import { shouldUseMockFallback } from "@/lib/api/mockFallback";
import { normalizeJobForUi } from "@/lib/utils/resource";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { isLinkedInCloudAutoApplyEnabled } from "@/lib/feature-flags";
import { resolvePipelineStage } from "@/lib/jobs/pipeline-stage";
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
  const advancedUi = useAdvancedUi();
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
      showSuccess(advancedUi ? t("jobDetail.toast.archived") : t("jobDetail.simple.toastNotInterested"));
      router.push("/jobs");
    } catch {
      showError(t("jobDetail.toast.archiveFail"));
    }
  }, [id, jobsApi, router, withLoading, t, advancedUi]);

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
    [applicationsApi, id, refetchJob, t]
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
  const showStickyBar = shouldShowApplyStickyBar(job);
  const cloudAutoApplyEnabled = isLinkedInCloudAutoApplyEnabled();

  const actionBar = (
    <>
      {isUsingFallback && <ApiStatusIndicator usingMock />}
      <ActionButton
        label={t("jobDetail.checkDuplicate")}
        loading={actionLoading === "duplicate"}
        disabled={actionDisabled}
        onClick={handleCheckDuplicate}
        variant="outline"
        className="hidden md:inline-flex"
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
        className="hidden md:inline-flex"
      />
      <ActionButton
        label={t("jobDetail.provisionFolders")}
        loading={actionLoading === "folders"}
        disabled={actionDisabled}
        onClick={handleProvisionFolders}
        variant="outline"
        className="hidden lg:inline-flex"
      />
      <Link href={`/jobs/${id}/apply`} className={showStickyBar ? "hidden md:inline-flex" : "inline-flex"}>
        <Button type="button" variant="default" className="min-h-[44px] bg-emerald-600 text-white hover:bg-emerald-700">
          {t("applyAssistant.applyCta")}
        </Button>
      </Link>
      {!showStickyBar ? (
        <>
          {cloudAutoApplyEnabled && resolvePipelineStage(job) === "Ready" ? (
            <ActionButton
              label="⚡ Auto Apply"
              loading={actionLoading === "autoApply"}
              disabled={actionDisabled}
              onClick={handleAutoApply}
              variant="default"
              className="hidden md:inline-flex bg-blue-600 text-white hover:bg-blue-700"
            />
          ) : null}
          <ActionButton
            label={t("jobDetail.logApplication")}
            loading={applicationsApi.createApplicationLoading}
            disabled={actionDisabled || applicationsApi.createApplicationLoading}
            onClick={() => setLogAppOpen(true)}
            variant="secondary"
          />
        </>
      ) : null}
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

  return (
    <>
      <LogApplicationModal
        open={logAppOpen}
        onClose={() => setLogAppOpen(false)}
        onSubmit={handleLogApplicationFromJob}
        loading={applicationsApi.createApplicationLoading}
        fixedJobId={id}
        initialJob={job}
      />

      {advancedUi ? (
        <JobDetailAdvancedView
          job={job}
          jobId={id}
          actionBar={actionBar}
          duplicateFollowUp={duplicateFollowUp}
          profileContextLine={profileAiContextCopy(job)}
        />
      ) : (
        <JobDetailSimpleView
          job={job}
          jobId={id}
          actionDisabled={actionDisabled}
          actionLoading={actionLoading}
          logAppLoading={applicationsApi.createApplicationLoading}
          onMarkApplied={() => setLogAppOpen(true)}
          onNotInterested={() => void handleArchive()}
        />
      )}
    </>
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
      size="lg"
      disabled={disabled}
      onClick={() => {
        void Promise.resolve(onClick()).catch(() => void 0);
      }}
      className={cn("shrink-0 md:h-10 md:min-h-[38px] md:px-4", className)}
      suppressHydrationWarning
    >
      <span className="contents" suppressHydrationWarning>
        {loading && <LoaderIcon size={14} className="mr-2" />}
        {label}
      </span>
    </Button>
  );
}
