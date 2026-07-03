"use client";

import { useCallback, useEffect, useState } from "react";
import { AdvancedTodayDashboard } from "@/components/dashboard/AdvancedTodayDashboard";
import { SimpleTodayDashboard } from "@/components/dashboard/SimpleTodayDashboard";
import { TodayPageSkeleton } from "@/components/shared/CustomerPageSkeletons";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAdvancedUi } from "@/context/AuthSessionContext";
import { useTranslation } from "@/i18n/useTranslation";
import { getTodaySummary } from "@/lib/api/today.api";

export function DashboardPageClient() {
  const { t } = useTranslation();
  const advancedUi = useAdvancedUi();
  const [today, setToday] = useState<Awaited<ReturnType<typeof getTodaySummary>> | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);

  const loadToday = useCallback(() => {
    setTodayLoading(true);
    setTodayError(null);
    void getTodaySummary()
      .then(setToday)
      .catch((e) => setTodayError(e instanceof Error ? e.message : t("common.error")))
      .finally(() => setTodayLoading(false));
  }, [t]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  if (todayLoading && !today) {
    return <TodayPageSkeleton />;
  }

  if (todayError && !today) {
    return (
      <div className="section-spacing">
        <ErrorState
          title={t("today.errorTitle")}
          description={todayError}
          actionLabel={t("common.retry")}
          onAction={loadToday}
        />
      </div>
    );
  }

  const dashboardProps = { today, todayLoading, todayError };

  if (advancedUi) {
    return <AdvancedTodayDashboard {...dashboardProps} />;
  }

  return <SimpleTodayDashboard today={today} />;
}
