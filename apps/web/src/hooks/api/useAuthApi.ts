"use client";

import { useCallback, useState } from "react";
import * as authApi from "@/lib/api/auth.api";

export function useAuthApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      return await authApi.login({ email, password });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; workspaceName: string }) => {
      setLoading(true);
      setError(null);
      try {
        return await authApi.register(payload);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Registration failed";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    login,
    register,
    logout: authApi.logout,
    me: authApi.me,
    loading,
    error,
    clearError: () => setError(null),
  };
}
