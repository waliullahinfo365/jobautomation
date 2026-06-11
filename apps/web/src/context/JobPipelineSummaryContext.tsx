"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getJobPipelineSummary, type PipelineSummaryResponse } from "@/lib/api/jobs.api";

type JobPipelineSummaryContextValue = {
  /** Full API response when loaded successfully. */
  summary: PipelineSummaryResponse | null;
  loading: boolean;
  error: Error | null;
  /** Count for a single pipeline status (e.g. `"New"`, `"Applied"`). */
  count: (status: string) => number;
  /** All non-archived jobs in the pipeline (matches API `totalActive`). */
  totalActive: number;
  refetch: () => Promise<void>;
};

const JobPipelineSummaryContext = createContext<JobPipelineSummaryContextValue | null>(null);

export function JobPipelineSummaryProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<PipelineSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJobPipelineSummary();
      setSummary(res);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const countByStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of summary?.pipeline ?? []) {
      m.set(row.status, row.count);
    }
    return m;
  }, [summary]);

  const count = useCallback((status: string) => countByStatus.get(status) ?? 0, [countByStatus]);

  const value = useMemo<JobPipelineSummaryContextValue>(
    () => ({
      summary,
      loading,
      error,
      count,
      totalActive: summary?.totalActive ?? 0,
      refetch: load,
    }),
    [summary, loading, error, count, load]
  );

  return <JobPipelineSummaryContext.Provider value={value}>{children}</JobPipelineSummaryContext.Provider>;
}

export function useJobPipelineSummary() {
  const ctx = useContext(JobPipelineSummaryContext);
  if (!ctx) {
    throw new Error("useJobPipelineSummary must be used within JobPipelineSummaryProvider");
  }
  return ctx;
}
