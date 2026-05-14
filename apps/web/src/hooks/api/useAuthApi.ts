"use client";

import { useCallback, useState } from "react";
import * as authApi from "@/lib/api/auth.api";
import { ApiError } from "@/lib/api/client";

const API_CONNECTION_ERROR = "API connection failed. Check API deployment/CORS.";

function authErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.isNetworkError) return API_CONNECTION_ERROR;
  if (error instanceof TypeError) return API_CONNECTION_ERROR;
  if (error instanceof Error && /failed to fetch|network request failed|load failed/i.test(error.message)) {
    return API_CONNECTION_ERROR;
  }
  return error instanceof Error ? error.message : fallback;
}

export function useAuthApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      return await authApi.login({ email, password });
    } catch (e) {
      const msg = authErrorMessage(e, "Login failed");
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
        const msg = authErrorMessage(e, "Registration failed");
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
