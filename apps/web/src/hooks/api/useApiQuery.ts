"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMockFallback, shouldUseMockFallback } from "@/lib/api/mockFallback";

type UseApiQueryOptions<T> = {
  enabled?: boolean;
  fallbackToMock?: boolean;
  fallbackData?: T;
  mockResourceName?: string;
  /** When this value changes, the query re-runs (e.g. route `id`). */
  refreshKey?: string | number;
};

export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  options?: UseApiQueryOptions<T>
) {
  const [data, setData] = useState<T | undefined>(options?.fallbackData);
  const [loading, setLoading] = useState<boolean>(options?.enabled !== false);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Guard: prevents concurrent / duplicate fetches on the same instance.
  // React Strict Mode fires effects twice; the second fire sees this as true and exits.
  const fetchingRef = useRef(false);

  const enabled = options?.enabled !== false;
  const refreshKey = options?.refreshKey ?? "";

  const refetch = useCallback(async () => {
    const o = optionsRef.current;
    if (o?.enabled === false) return;

    fetchingRef.current = false; // allow refetch regardless of guard state
    setLoading(true);
    setError(null);
    try {
      const result = await queryFnRef.current();
      setData(result);
      setIsUsingFallback(false);
    } catch (err) {
      const o2 = optionsRef.current;
      const fallbackAllowed = o2?.fallbackToMock && shouldUseMockFallback(err);
      if (fallbackAllowed && o2?.mockResourceName) {
        setData(getMockFallback(o2.mockResourceName) as T);
        setIsUsingFallback(true);
      } else if (fallbackAllowed && o2?.fallbackData !== undefined) {
        setData(o2.fallbackData);
        setIsUsingFallback(true);
      } else {
        setError(err as Error);
        setIsUsingFallback(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (fetchingRef.current) return; // already fetching — skip (handles Strict Mode double-run)
    fetchingRef.current = true;

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await queryFnRef.current();
        setData(result);
        setIsUsingFallback(false);
      } catch (err) {
        const o = optionsRef.current;
        const fallbackAllowed = o?.fallbackToMock && shouldUseMockFallback(err);
        if (fallbackAllowed && o?.mockResourceName) {
          setData(getMockFallback(o.mockResourceName) as T);
          setIsUsingFallback(true);
        } else if (fallbackAllowed && o?.fallbackData !== undefined) {
          setData(o.fallbackData);
          setIsUsingFallback(true);
        } else {
          setError(err as Error);
          setIsUsingFallback(false);
        }
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    })();
  }, [enabled, refreshKey]);

  return { data, loading, error, isUsingFallback, refetch };
}
