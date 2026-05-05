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
import type { Job } from "@/types/job";

interface JobDetailPageClientProps {
  id: string;
}

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_TICKS = 12;

export function JobDetailPageClient({ id }: JobDetailPageClientProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logAppOpen, setLogAppOpen] = useState(false);
  const [duplicateFollowUp, setDuplicateFollowUp] = useState<{ jobId: string; status: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mockFallbackJob = mockJobs.find((j) => j.id === id || j._id === id);

  const { data: rawJob, loading, isUsingFallback, refetch: refetchJob } = useJobDetail(id, {
    fallbackToMock: true,
    mockFallbackJob,
  });

  const jobsApi = useJobsApi();
  const applicationsApi = useApplicationsApi({ fallbackToMock: true });

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
      showSuccess("No duplicate found.");
      await refetchJob();
    } catch {
      showError("Duplicate check failed.");
    }
  }, [id, jobsApi, refetchJob, withLoading]);

  const handleGenerateResearch = useCallback(async () => {
    try {
      const res = await withLoading("research", () => jobsApi.generateResearch({ id, execute: false }));
      if (res.status === "skipped") {
        showInfo(res.message || "This action was already queued recently. Please wait a moment.");
        return;
      }
      showSuccess("Research generation started.");
      startPollingJob();
    } catch {
      showError("Failed to queue research generation.");
    }
  }, [id, jobsApi, startPollingJob, withLoading]);

  const handleGenerateDraft = useCallback(async () => {
    try {
      const res = await withLoading("draft", () => jobsApi.generateDraft({ id, execute: false }));
      if (res.status === "skipped") {
        showInfo(res.message || "This action was already queued recently. Please wait a moment.");
        return;
      }
      showSuccess("Draft generation started.");
      startPollingJob();
    } catch {
      showError("Failed to queue draft generation.");
    }
  }, [id, jobsApi, startPollingJob, withLoading]);

  const handleRunAiProcessing = useCallback(async () => {
    try {
      const res = await withLoading("ai", () => jobsApi.runAiProcessing({ id, options: { mode: "full" } }));
      if (res.status === "skipped") {
        showInfo(res.message || "This action was already queued recently. Please wait a moment.");
        return;
      }
      showSuccess("AI processing started.");
      startPollingJob();
    } catch {
      showError("Failed to queue AI processing.");
    }
  }, [id, jobsApi, startPollingJob, withLoading]);

  const handleProvisionFolders = useCallback(async () => {
    try {
      const res = await withLoading("folders", () => jobsApi.provisionFolders({ id, execute: false }));
      if (res.status === "skipped") {
        showInfo(res.message || "This action was already queued recently. Please wait a moment.");
        return;
      }
      showSuccess("Folder provisioning started.");
      startPollingJob();
    } catch {
      showError("Failed to queue folder provisioning.");
    }
  }, [id, jobsApi, startPollingJob, withLoading]);

  const handleArchive = useCallback(async () => {
    try {
      await withLoading("archive", () => jobsApi.archive(id));
      showSuccess("Job archived.");
      router.push("/jobs");
    } catch {
      showError("Failed to archive job.");
    }
  }, [id, jobsApi, router, withLoading]);

  const handleLogApplicationFromJob = useCallback(
    async (form: CreateApplicationFormPayload) => {
      const payload = buildCreateApplicationPayload({ ...form, jobId: form.jobId || id });
      try {
        await applicationsApi.createApplication(payload);
        showSuccess("Application logged successfully.");
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
          showInfo("API offline, added demo application locally.");
          setLogAppOpen(false);
        } else {
          showError(e instanceof ApiError ? e.message : "Failed to log application.");
        }
      }
    },
    [applicationsApi, id, jobsApi, refetchJob]
  );

  if (loading && !job) {
    return <LoadingState title="Loading job..." description="Fetching job details from the backend." />;
  }

  if (!job) {
    return (
      <EmptyState
        title="Job not found"
        description="This job does not exist or could not be loaded."
        actionLabel="Back to Jobs"
        onAction={() => router.push("/jobs")}
      />
    );
  }

  const actionDisabled = actionLoading !== null;

  const actionBar = (
    <>
      {isUsingFallback && <ApiStatusIndicator usingMock />}
      <ActionButton
        label="Check Duplicate"
        loading={actionLoading === "duplicate"}
        disabled={actionDisabled}
        onClick={handleCheckDuplicate}
        variant="outline"
      />
      <ActionButton
        label="Generate Research"
        loading={actionLoading === "research"}
        disabled={actionDisabled}
        onClick={handleGenerateResearch}
        variant="outline"
      />
      <ActionButton
        label="Generate Draft"
        loading={actionLoading === "draft"}
        disabled={actionDisabled}
        onClick={handleGenerateDraft}
        variant="secondary"
      />
      <ActionButton
        label="Run AI Processing"
        loading={actionLoading === "ai"}
        disabled={actionDisabled}
        onClick={handleRunAiProcessing}
      />
      <ActionButton
        label="Provision Folders"
        loading={actionLoading === "folders"}
        disabled={actionDisabled}
        onClick={handleProvisionFolders}
        variant="outline"
      />
      <ActionButton
        label="Log Application"
        loading={applicationsApi.createApplicationLoading}
        disabled={actionDisabled || applicationsApi.createApplicationLoading}
        onClick={() => setLogAppOpen(true)}
        variant="secondary"
      />
      <ActionButton
        label="Archive"
        loading={actionLoading === "archive"}
        disabled={actionDisabled}
        onClick={handleArchive}
        variant="outline"
        className="text-rose-600 hover:text-rose-700"
      />
    </>
  );

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

          <SectionCard title="Job Description">
            <p className="text-sm leading-6 text-[var(--text-2)]">{job.description}</p>
            {job.aiSummary && (
              <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <SparklesIcon size={16} className="text-[var(--violet)]" />
                  <p className="text-sm font-medium text-purple-800">AI Summary</p>
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
      onClick={onClick}
      className={className}
    >
      {loading && <LoaderIcon size={14} className="mr-2" />}
      {label}
    </Button>
  );
}
