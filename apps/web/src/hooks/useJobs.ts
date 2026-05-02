"use client";

import { useState, useEffect, useCallback } from "react";
import type { Job, JobFilters, JobSummary } from "@/types/job";
import type { PaginationParams } from "@/types/api";

interface UseJobsState {
  jobs:       JobSummary[];
  total:      number;
  isLoading:  boolean;
  error:      string | null;
}

export function useJobs(
  filters?: JobFilters,
  pagination?: PaginationParams
) {
  const [state, setState] = useState<UseJobsState>({
    jobs:      [],
    total:     0,
    isLoading: true,
    error:     null,
  });

  const fetchJobs = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", String(filters.status));
      if (filters?.query) params.set("search", filters.query);
      if (pagination?.page) params.set("page", String(pagination.page));
      if (pagination?.pageSize) params.set("pageSize", String(pagination.pageSize));

      const res  = await fetch(`/api/jobs?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Failed to fetch jobs");

      setState({ jobs: json.data.items, total: json.data.total, isLoading: false, error: null });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false, error: (err as Error).message }));
    }
  }, [filters, pagination]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return { ...state, refresh: fetchJobs };
}

export function useJob(id: string) {
  const [job,       setJob]       = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error);
        setJob(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { job, isLoading, error };
}
