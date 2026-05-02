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
  const items = [
    {
      label: "Total Jobs Tracked",
      value: stats.totalJobsTracked,
      meta: "vs. last week",
      delta: "+6.4%",
      deltaTone: "up" as const,
      icon: TrackedJobsIcon,
      iconTint: "default" satisfies IconTintKey,
      seed: stats.totalJobsTracked * 7 + 3,
    },
    {
      label: "Applications Sent",
      value: stats.applicationsSent,
      meta: "submitted this week",
      delta: "+3",
      deltaTone: "up" as const,
      icon: SendIcon,
      iconTint: "violet" satisfies IconTintKey,
      seed: stats.applicationsSent * 11 + 1,
    },
    {
      label: "Interviews Scheduled",
      value: stats.interviewsScheduled,
      meta: "upcoming sessions",
      delta: `${Math.min(stats.interviewsScheduled, 9)}`,
      deltaTone: "neutral" as const,
      icon: CalendarCheckIcon,
      iconTint: "teal" satisfies IconTintKey,
      seed: stats.interviewsScheduled * 5 + 8,
    },
    {
      label: "Offers Received",
      value: stats.offersReceived,
      meta: "awaiting decision",
      delta: stats.offersReceived > 0 ? "Active" : "—",
      deltaTone: stats.offersReceived > 0 ? ("up" as const) : ("neutral" as const),
      icon: TrophyIcon,
      iconTint: "emerald" satisfies IconTintKey,
      seed: stats.offersReceived * 13 + 2,
    },
    {
      label: "Follow-ups Due",
      value: stats.followUpsDue,
      meta: stats.followUpsDue === 0 ? "all caught up" : "needs attention",
      delta: stats.followUpsDue === 0 ? "Clear" : `${stats.followUpsDue}`,
      deltaTone: stats.followUpsDue === 0 ? ("up" as const) : ("down" as const),
      icon: FollowUpIcon,
      iconTint: "amber" satisfies IconTintKey,
      seed: stats.followUpsDue * 19 + 4,
    },
    {
      label: "Automations Active",
      value: stats.automationsActive,
      meta: "avg. success rate",
      delta: "92%",
      deltaTone: "up" as const,
      icon: BotIcon,
      iconTint: "default" satisfies IconTintKey,
      seed: stats.automationsActive * 3 + 9,
    },
  ];

  return (
    <div className="jf-kpi-grid min-w-0">
      {items.map((item, i) => {
        const Icon = item.icon;
        const stagger = `jf-kpi-stagger-${i + 1}` as const;
        return (
          <motion.article
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn("jf-kpi", stagger)}
          >
            <div className="jf-kpi-head">
              <div className="jf-kpi-label">{item.label}</div>
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
                {item.deltaTone === "up" && item.label === "Automations Active" ? (
                  <>
                    <TrendUpIcon size={10} />
                    {item.delta}
                  </>
                ) : (
                  item.delta
                )}
              </span>
              <span className="jf-kpi-meta">{item.meta}</span>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
