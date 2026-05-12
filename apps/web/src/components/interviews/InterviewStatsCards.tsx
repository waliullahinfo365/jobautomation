"use client";

import {
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  Clock3Icon,
  Link2Icon,
} from "@/components/icons";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { useTranslation } from "@/i18n/useTranslation";

export function InterviewStatsCards({
  stats,
}: {
  stats: {
    totalInterviews: number;
    thisWeek: number;
    awaitingConfirmation: number;
    prepTasksDue: number;
    completedInterviews: number;
    calendarSynced: number;
  };
}) {
  const { t } = useTranslation();

  const cards = [
    { label: t("interviews.stats.totalInterviews"), value: stats.totalInterviews, helper: t("interviews.stats.acrossPipelineStages"), icon: <CalendarDaysIcon size={20} /> },
    { label: t("interviews.stats.thisWeek"), value: stats.thisWeek, helper: t("interviews.stats.upcomingNext7Days"), icon: <CalendarClockIcon size={20} /> },
    { label: t("interviews.stats.awaitingConfirmation"), value: stats.awaitingConfirmation, helper: t("interviews.stats.needsResponseToLockSlot"), icon: <Clock3Icon size={20} /> },
    { label: t("interviews.stats.prepTasksDue"), value: stats.prepTasksDue, helper: t("interviews.stats.notStartedOrOverdue"), icon: <ClipboardCheckIcon size={20} /> },
    { label: t("interviews.stats.completedInterviews"), value: stats.completedInterviews, helper: t("interviews.stats.finishedInterviewRounds"), icon: <CalendarCheckIcon size={20} /> },
    { label: t("interviews.stats.calendarSynced"), value: stats.calendarSynced, helper: t("interviews.stats.syncedEventsInCalendar"), icon: <Link2Icon size={20} /> },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
          <Card className="hover-lift">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    <AnimatedCounter value={card.value} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
                </div>
                <div className="rounded-xl bg-[var(--accent-bg)] p-2.5 text-[var(--accent-hi)]">{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
