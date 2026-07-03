"use client";

import { useMemo } from "react";
import { useDocumentsApi } from "@/hooks/api/useDocumentsApi";
import { useIntegrationsApi } from "@/hooks/api/useIntegrationsApi";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeDocumentRecordsForUi, normalizeJobForUi } from "@/lib/utils/resource";
import type { JobStatus } from "@/types/job";

const REVIEWED_STATUSES = new Set<JobStatus>([
  "Saved",
  "Drafting",
  "Ready",
  "Applied",
  "Interview",
  "Offer",
  "Closed",
]);

export interface OnboardingStep {
  id: "gmail" | "resume" | "coverTemplate" | "reviewJobs";
  complete: boolean;
  href: string;
}

export interface OnboardingStatus {
  steps: OnboardingStep[];
  completedCount: number;
  totalSteps: number;
  isComplete: boolean;
  loading: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const integrationsApi = useIntegrationsApi({ fallbackToMock: false });
  const documentsApi = useDocumentsApi({ fallbackToMock: false });
  const jobsApi = useJobsApi({ fallbackToMock: false });

  const loading = integrationsApi.integrationsLoading || documentsApi.loading || jobsApi.loading;

  return useMemo(() => {
    const integrations = integrationsApi.integrations ?? [];
    const gmail = integrations.find((i) => i.slug === "gmail");
    const gmailConnected =
      gmail?.status === "Connected" &&
      !gmail?.errorMessage;

    const documents = normalizeDocumentRecordsForUi(normalizeListResponse<unknown>(documentsApi.data));
    const resumeUploaded = documents.some(
      (d) =>
        (d.profileDocumentType === "cv_resume" && d.isActiveProfileDocument) ||
        d.type === "CV"
    );
    const coverTemplateUploaded = documents.some(
      (d) =>
        (d.profileDocumentType === "cover_letter_template" && d.isActiveProfileDocument) ||
        d.type === "Cover Letter Template"
    );

    const jobs = normalizeListResponse<unknown>(jobsApi.data).map(normalizeJobForUi);
    const jobsReviewed = jobs.some(
      (job) =>
        (job.reviewStatus && job.reviewStatus !== "new") ||
        Boolean(job.reviewedAt) ||
        REVIEWED_STATUSES.has(job.status)
    );

    const steps: OnboardingStep[] = [
      { id: "gmail", complete: gmailConnected, href: "/settings?section=Integrations" },
      { id: "resume", complete: resumeUploaded, href: "/documents" },
      { id: "coverTemplate", complete: coverTemplateUploaded, href: "/documents" },
      { id: "reviewJobs", complete: jobsReviewed, href: "/jobs/review" },
    ];

    const completedCount = steps.filter((s) => s.complete).length;

    return {
      steps,
      completedCount,
      totalSteps: steps.length,
      isComplete: completedCount === steps.length,
      loading,
    };
  }, [
    integrationsApi.integrations,
    documentsApi.data,
    jobsApi.data,
    loading,
  ]);
}
