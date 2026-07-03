"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { me } from "@/lib/api/auth.api";
import { ApiError, clearAuthToken, getAuthToken } from "@/lib/api/client";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { useTranslation } from "@/i18n/useTranslation";
import { AuthSessionProvider, buildAuthSession, type AuthSession } from "@/context/AuthSessionContext";
import { canAccessRoute, getDefaultAppPath } from "@/lib/auth/routeAccess";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let alive = true;
    async function run() {
      const token = getAuthToken();
      if (!token) {
        clearAuthToken();
        router.replace("/login");
        return;
      }
      try {
        const payload = await me();
        const nextSession = buildAuthSession(payload);
        if (!canAccessRoute(pathname, nextSession.productRole, nextSession.advancedUi)) {
          router.replace(getDefaultAppPath(nextSession.productRole));
          return;
        }
        if (alive) {
          setSessionError(null);
          setSession(nextSession);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }
        if (alive) {
          setSession(null);
          setSessionError(e instanceof Error ? e.message : t("common.error"));
        }
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, [router, pathname, retryKey, t]);

  if (sessionError) {
    return (
      <div className="mx-auto w-full max-w-[1480px] p-6">
        <ErrorState
          title={t("loading.session")}
          description={sessionError}
          actionLabel={t("common.retry")}
          onAction={() => setRetryKey((k) => k + 1)}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-[1480px] p-6">
        <LoadingState title={t("loading.session")} description={t("loading.sessionDesc")} />
      </div>
    );
  }

  return <AuthSessionProvider session={session}>{children}</AuthSessionProvider>;
}
