import {
  BellRingIcon,
  Clock3Icon,
  FileTextIcon,
  HandCoinsIcon,
  InterviewsIcon,
  ReplyIcon,
} from "@/components/icons";

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
  return (
    <div className="jf-kpi-grid">
      <StatCard
        label="Total Applications"
        value={stats.totalApplications}
        hint="Across all active sources"
        icon={<FileTextIcon size={14} />}
      />
      <StatCard
        label="Awaiting Response"
        value={stats.awaitingResponse}
        hint="No recruiter reply yet"
        icon={<Clock3Icon size={14} />}
      />
      <StatCard
        label="Replies Received"
        value={stats.repliesReceived}
        hint="Detected by reply engine"
        icon={<ReplyIcon size={14} />}
      />
      <StatCard
        label="Interviews Scheduled"
        value={stats.interviewsScheduled}
        hint="Upcoming interview loops"
        icon={<InterviewsIcon size={14} />}
      />
      <StatCard
        label="Follow-ups Due"
        value={stats.followUpsDue}
        hint="Requires manual action today"
        icon={<BellRingIcon size={14} />}
      />
      <StatCard
        label="Offers"
        value={stats.offers}
        hint="Current offer-stage applications"
        icon={<HandCoinsIcon size={14} />}
      />
    </div>
  );
}
