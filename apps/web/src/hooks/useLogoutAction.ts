"use client";

import { useRouter } from "next/navigation";
import { logout as logoutApi } from "@/lib/api/auth.api";
import { clearAuthToken } from "@/lib/api/client";
import { showSuccess } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";

export function useLogoutAction(onBeforeRedirect?: () => void) {
  const router = useRouter();
  const { t } = useTranslation();

  return () => {
    void logoutApi().finally(() => {
      clearAuthToken();
      try {
        localStorage.removeItem("tenantId");
        localStorage.removeItem("userId");
        sessionStorage.removeItem("tenantId");
        sessionStorage.removeItem("userId");
      } catch {
        /* ignore */
      }
      onBeforeRedirect?.();
      showSuccess(t("topbar.loggedOut"));
      router.replace("/login");
    });
  };
}
