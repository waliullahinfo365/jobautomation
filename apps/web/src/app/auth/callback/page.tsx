"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";
import { invalidateApiCache, setAuthToken } from "@/lib/api/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const tenantId = searchParams.get("tenantId");
    const userId = searchParams.get("userId");
    const googleError = searchParams.get("google_error");

    if (googleError) {
      router.replace(`/login?google_error=${encodeURIComponent(googleError)}`);
      return;
    }

    if (token && tenantId && userId) {
      setAuthToken(token);
      try {
        localStorage.setItem("tenantId", tenantId);
        localStorage.setItem("userId", userId);
      } catch {
        /* ignore */
      }
      invalidateApiCache();
      router.replace("/dashboard");
      return;
    }

    router.replace("/login");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
