"use client";

import {
  BotIcon,
  CalendarCheckIcon,
  FollowUpIcon,
  SendIcon,
  TrackedJobsIcon,
  TrendUpIcon,
  TrophyIcon,
} from "@/components/icons";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardsProps {
  stats: {
    totalJobsTracked: number;
    applicationsSent: number;
    interviewsScheduled: number;
    offersReceived: number;
    followUpsDue: number;
    automationsActive: number;
    automationSuccessRate: number | null;
  };
}

const tint = {
  default: "jf-kpi-icon",
  emerald: "jf-kpi-icon jf-kpi-icon--emerald",
  violet: "jf-kpi-icon jf-kpi-icon--violet",
  amber: "jf-kpi-icon jf-kpi-icon--amber",
  teal: "jf-kpi-icon jf-kpi-icon--teal",
} as const;

type IconTintKey = keyof typeof tint;

function MiniBars({ seed }: { seed: number }) {
  const heights = Array.from({ length: 7 }, (_, i) => {
    const h = 18 + ((seed + i * 17) % 82);
    return `${h}%`;
  });
  return (
    <div className="jf-kpi-spark">
      <div className="jf-kpi-mini-bars" aria-hidden>
        {heights.map((h, i) => (
          <i key={i} style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useTranslation();

  const items = [
    {
      labelKey: "dashboard.stats.totalJobsTracked",
      value: stats.totalJobsTracked,
      metaKey: "dashboard.stats.metaTotal",
      delta: stats.totalJobsTracked > 0 ? `${stats.totalJobsTracked}` : "—",
      deltaTone: "neutral" as const,
      icon: TrackedJobsIcon,
      iconTint: "default" satisfies IconTintKey,
      seed: stats.totalJobsTracked * 7 + 3,
      showTrend: false,
    },
    {
      labelKey: "dashboard.stats.applicationsSent",
      value: stats.applicationsSent,
      metaKey: "dashboard.stats.metaTotal",
      delta: stats.applicationsSent > 0 ? `${stats.applicationsSent}` : "—",
      deltaTone: "neutral" as const,
      icon: SendIcon,
      iconTint: "violet" satisfies IconTintKey,
      seed: stats.applicationsSent * 11 + 1,
      showTrend: false,
    },
    {
      labelKey: "dashboard.stats.interviewsScheduled",
      value: stats.interviewsScheduled,
      metaKey: "dashboard.stats.metaUpcoming",
      delta: `${Math.min(stats.interviewsScheduled, 9)}`,
      deltaTone: "neutral" as const,
      icon: CalendarCheckIcon,
      iconTint: "teal" satisfies IconTintKey,
      seed: stats.interviewsScheduled * 5 + 8,
      showTrend: false,
    },
    {
      labelKey: "dashboard.stats.offersReceived",
      value: stats.offersReceived,
      metaKey: "dashboard.stats.metaAwaiting",
      delta: stats.offersReceived > 0 ? t("dashboard.stats.deltaActive") : "—",
      deltaTone: stats.offersReceived > 0 ? ("up" as const) : ("neutral" as const),
      icon: TrophyIcon,
      iconTint: "emerald" satisfies IconTintKey,
      seed: stats.offersReceived * 13 + 2,
      showTrend: false,
    },
    {
      labelKey: "dashboard.stats.followUpsDue",
      value: stats.followUpsDue,
      metaKey: stats.followUpsDue === 0 ? "dashboard.stats.metaAllCaughtUp" : "dashboard.stats.metaNeedsAttention",
      delta: stats.followUpsDue === 0 ? t("dashboard.stats.deltaClear") : `${stats.followUpsDue}`,
      deltaTone: stats.followUpsDue === 0 ? ("up" as const) : ("down" as const),
      icon: FollowUpIcon,
      iconTint: "amber" satisfies IconTintKey,
      seed: stats.followUpsDue * 19 + 4,
      showTrend: false,
    },
    {
      labelKey: "dashboard.stats.automationsActive",
      value: stats.automationsActive,
      metaKey: "dashboard.stats.metaSuccessRate",
      delta: stats.automationSuccessRate !== null ? `${stats.automationSuccessRate}%` : "—",
      deltaTone: stats.automationSuccessRate !== null && stats.automationSuccessRate >= 80 ? ("up" as const) : ("neutral" as const),
      icon: BotIcon,
      iconTint: "default" satisfies IconTintKey,
      seed: stats.automationsActive * 3 + 9,
      showTrend: stats.automationSuccessRate !== null,
    },
  ];

  return (
    <div className="jf-kpi-grid min-w-0">
      {items.map((item, i) => {
        const Icon = item.icon;
        const stagger = `jf-kpi-stagger-${i + 1}` as const;
        return (
          <motion.article
            key={item.labelKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn("jf-kpi", stagger)}
          >
            <div className="jf-kpi-head">
              <div className="jf-kpi-label">{t(item.labelKey)}</div>
              <div className={tint[item.iconTint as IconTintKey]}>
                <Icon size={14} />
              </div>
            </div>
            <div className="jf-kpi-row">
              <div className="jf-kpi-value">
                {typeof item.value === "number" ? <AnimatedCounter value={item.value} /> : item.value}
              </div>
              <MiniBars seed={item.seed} />
            </div>
            <div className="jf-kpi-foot">
              <span
                className={cn(
                  "jf-kpi-delta",
                  item.deltaTone === "up" && "jf-kpi-delta--up",
                  item.deltaTone === "down" && "jf-kpi-delta--down",
                  item.deltaTone === "neutral" && "jf-kpi-delta--neutral"
                )}
              >
                {item.showTrend ? (
                  <>
                    <TrendUpIcon size={10} />
                    {item.delta}
                  </>
                ) : (
                  item.delta
                )}
              </span>
              <span className="jf-kpi-meta">{t(item.metaKey)}</span>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
