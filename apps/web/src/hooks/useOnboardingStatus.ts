"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocumentsApi } from "@/hooks/api/useDocumentsApi";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeDocumentRecordsForUi, normalizeJobForUi } from "@/lib/utils/resource";
import { getUnipileStatus } from "@/lib/api/unipile.api";
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
  id: "email" | "resume" | "coverTemplate" | "reviewJobs";
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
  const documentsApi = useDocumentsApi({ fallbackToMock: false });
  const jobsApi = useJobsApi({ fallbackToMock: false });
  const [emailConnected, setEmailConnected] = useState(false);
  const [emailLoading, setEmailLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getUnipileStatus()
      .then((s) => {
        if (!cancelled) setEmailConnected(Boolean(s.connected));
      })
      .catch(() => {
        if (!cancelled) setEmailConnected(false);
      })
      .finally(() => {
        if (!cancelled) setEmailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = emailLoading || documentsApi.loading || jobsApi.loading;

  return useMemo(() => {
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
      { id: "email", complete: emailConnected, href: "/settings?section=Integrations" },
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
  }, [documentsApi.data, jobsApi.data, loading, emailConnected]);
}
