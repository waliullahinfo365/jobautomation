"use client";

import { useState, useEffect } from "react";
import type { DailyDigestReport } from "@/types/report";

export interface DashboardStats {
  totalJobs:           number;
  activeJobs:          number;
  appliedThisWeek:     number;
  interviewsThisWeek:  number;
  pendingFollowUps:    number;
  overdueDeadlines:    number;
  automationErrors:    number;
  recentActivity:      { label: string; value: number }[];
  pipelineBreakdown:   { status: string; count: number }[];
}

export function useDashboardStats() {
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports?type=dashboard-stats")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error);
        setStats(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { stats, isLoading, error };
}

export function useLatestDigest() {
  const [digest,    setDigest]    = useState<DailyDigestReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports?type=daily&limit=1")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error);
        setDigest(json.data?.items?.[0] ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { digest, isLoading, error };
}
