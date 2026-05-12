"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { me } from "@/lib/api/auth.api";
import { ApiError, clearAuthToken, getAuthToken } from "@/lib/api/client";
import { LoadingState } from "@/components/shared/LoadingState";
import { useTranslation } from "@/i18n/useTranslation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

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
        await me();
        if (alive) setReady(true);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }
        if (alive) setReady(true);
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[1480px] p-6">
        <LoadingState title={t("loading.session")} description={t("loading.sessionDesc")} />
      </div>
    );
  }
  return <>{children}</>;
}
