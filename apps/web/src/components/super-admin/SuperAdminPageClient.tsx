"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminDashboard } from "@/components/super-admin/SuperAdminDashboard";
import { LoadingState } from "@/components/shared/LoadingState";
import { useAuthSession } from "@/context/AuthSessionContext";
import { isSuperAdmin } from "@/config/productMode";
import { useTranslation } from "@/i18n/useTranslation";

export function SuperAdminPageClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useAuthSession();
  const allowed = isSuperAdmin(session?.productRole);

  useEffect(() => {
    if (session && !allowed) {
      router.replace("/today");
    }
  }, [session, allowed, router]);

  if (!session) {
    return <LoadingState title={t("superAdmin.loadingTitle")} description={t("superAdmin.loadingDesc")} />;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--text-1)]">{t("superAdmin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--text-3)]">{t("superAdmin.accessDeniedDesc")}</p>
      </div>
    );
  }

  return <SuperAdminDashboard />;
}
