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
import { useTranslation } from "@/i18n/useTranslation";
import { useMemo } from "react";

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
  const { t } = useTranslation();

  const cards = useMemo(
    () => [
      {
        key: "total",
        label: t("contacts.stats.totalContacts"),
        value: stats.totalContacts,
        helper: t("contacts.stats.totalContactsHelper"),
        icon: <UsersIcon size={20} />,
      },
      {
        key: "recruiters",
        label: t("contacts.stats.recruiters"),
        value: stats.recruiters,
        helper: t("contacts.stats.recruitersHelper"),
        icon: <UserRoundSearchIcon size={20} />,
      },
      {
        key: "referrals",
        label: t("contacts.stats.referrals"),
        value: stats.referrals,
        helper: t("contacts.stats.referralsHelper"),
        icon: <HandshakeIcon size={20} />,
      },
      {
        key: "followUps",
        label: t("contacts.stats.followUpsDue"),
        value: stats.followUpsDue,
        helper: t("contacts.stats.followUpsDueHelper"),
        icon: <BellRingIcon size={20} />,
      },
      {
        key: "conversations",
        label: t("contacts.stats.activeConversations"),
        value: stats.activeConversations,
        helper: t("contacts.stats.activeConversationsHelper"),
        icon: <MessageSquareTextIcon size={20} />,
      },
      {
        key: "interviews",
        label: t("contacts.stats.interviewsLinked"),
        value: stats.interviewsLinked,
        helper: t("contacts.stats.interviewsLinkedHelper"),
        icon: <CalendarCheckIcon size={20} />,
      },
    ],
    [stats, t]
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {cards.map((card) => (
        <motion.div
          key={card.key}
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.3 }}
        >
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
