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
  const cards = [
    { label: "Total Interviews", value: stats.totalInterviews, helper: "Across all pipeline stages", icon: <CalendarDaysIcon size={20} /> },
    { label: "This Week", value: stats.thisWeek, helper: "Upcoming in next 7 days", icon: <CalendarClockIcon size={20} /> },
    { label: "Awaiting Confirmation", value: stats.awaitingConfirmation, helper: "Needs response to lock slot", icon: <Clock3Icon size={20} /> },
    { label: "Prep Tasks Due", value: stats.prepTasksDue, helper: "Not started or overdue", icon: <ClipboardCheckIcon size={20} /> },
    { label: "Completed Interviews", value: stats.completedInterviews, helper: "Finished interview rounds", icon: <CalendarCheckIcon size={20} /> },
    { label: "Calendar Synced", value: stats.calendarSynced, helper: "Synced events in calendar", icon: <Link2Icon size={20} /> },
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
