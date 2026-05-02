"use client";

import {
  BellRingIcon,
  CalendarCheckIcon,
  HandshakeIcon,
  MessageSquareTextIcon,
  UserRoundSearchIcon,
  UsersIcon,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

export function ContactStatsCards({
  stats,
}: {
  stats: {
    totalContacts: number;
    recruiters: number;
    referrals: number;
    followUpsDue: number;
    activeConversations: number;
    interviewsLinked: number;
  };
}) {
  const cards = [
    { label: "Total Contacts", value: stats.totalContacts, helper: "Across all relationship types", icon: <UsersIcon size={20} /> },
    { label: "Recruiters", value: stats.recruiters, helper: "Active recruiting touchpoints", icon: <UserRoundSearchIcon size={20} /> },
    { label: "Referrals", value: stats.referrals, helper: "Warm-intro opportunities", icon: <HandshakeIcon size={20} /> },
    { label: "Follow-ups Due", value: stats.followUpsDue, helper: "Requires action today/overdue", icon: <BellRingIcon size={20} /> },
    { label: "Active Conversations", value: stats.activeConversations, helper: "Recent replies or threads", icon: <MessageSquareTextIcon size={20} /> },
    { label: "Interviews Linked", value: stats.interviewsLinked, helper: "Contacts mapped to interview stages", icon: <CalendarCheckIcon size={20} /> },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.3 }}>
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
