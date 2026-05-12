"use client";

import {
  BellRingIcon,
  Clock3Icon,
  FileTextIcon,
  HandCoinsIcon,
  InterviewsIcon,
  ReplyIcon,
} from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";

interface ApplicationStatsCardsProps {
  stats: {
    totalApplications: number;
    awaitingResponse: number;
    repliesReceived: number;
    interviewsScheduled: number;
    followUpsDue: number;
    offers: number;
  };
}

function StatCard({ label, value, hint, icon }: { label: string; value: number; hint: string; icon: React.ReactNode }) {
  return (
    <article className="jf-kpi">
      <div className="jf-kpi-head">
        <div className="jf-kpi-label">{label}</div>
        <div className="jf-kpi-icon [&_svg]:h-[14px] [&_svg]:w-[14px]">{icon}</div>
      </div>
      <div className="jf-kpi-value text-[26px]">{value}</div>
      <p className="mt-2 text-[11.5px] text-[var(--text-3)]">{hint}</p>
    </article>
  );
}

export function ApplicationStatsCards({ stats }: ApplicationStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="jf-kpi-grid">
      <StatCard
        label={t("applications.totalApplications")}
        value={stats.totalApplications}
        hint={t("applications.acrossAllActiveSources")}
        icon={<FileTextIcon size={14} />}
      />
      <StatCard
        label={t("applications.awaitingResponse")}
        value={stats.awaitingResponse}
        hint={t("applications.noRecruiterReplyYet")}
        icon={<Clock3Icon size={14} />}
      />
      <StatCard
        label={t("applications.repliesReceived")}
        value={stats.repliesReceived}
        hint={t("applications.detectedByReplyEngine")}
        icon={<ReplyIcon size={14} />}
      />
      <StatCard
        label={t("applications.interviewsScheduled")}
        value={stats.interviewsScheduled}
        hint={t("applications.upcomingInterviewLoops")}
        icon={<InterviewsIcon size={14} />}
      />
      <StatCard
        label={t("applications.followUpsDue")}
        value={stats.followUpsDue}
        hint={t("applications.requiresManualActionToday")}
        icon={<BellRingIcon size={14} />}
      />
      <StatCard
        label={t("applications.offers")}
        value={stats.offers}
        hint={t("applications.currentOfferStage")}
        icon={<HandCoinsIcon size={14} />}
      />
    </div>
  );
}
