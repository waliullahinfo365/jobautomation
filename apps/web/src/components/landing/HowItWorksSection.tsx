"use client";

import { motion } from "framer-motion";
import { Mail, Brain, LayoutDashboard, Zap } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Mail,
    title: "Connect Gmail & Accounts",
    description: "Link your Gmail account in under 60 seconds. NewJob Guru immediately starts monitoring your inbox for job opportunities, recruiter messages, and application updates — automatically.",
    highlight: "One-click setup · No technical knowledge needed",
    gradientText: "linear-gradient(135deg, #60a5fa, #22d3ee)",
    iconBg: "rgba(59,130,246,0.15)",
    iconColor: "#60a5fa",
    borderColor: "rgba(59,130,246,0.20)",
    glowColor: "rgba(59,130,246,0.25)",
    dotColor: "#60a5fa",
    tagBg: "rgba(59,130,246,0.10)",
    tagBorder: "rgba(59,130,246,0.20)",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Detects & Analyzes Jobs",
    description: "Our AI engine scans your emails, identifies job opportunities, scores them against your profile, and instantly imports them into your organized pipeline. Zero manual entry.",
    highlight: "Powered by advanced AI · Scores match to your CV",
    gradientText: "linear-gradient(135deg, #a78bfa, #ec4899)",
    iconBg: "rgba(139,92,246,0.15)",
    iconColor: "#a78bfa",
    borderColor: "rgba(139,92,246,0.20)",
    glowColor: "rgba(139,92,246,0.25)",
    dotColor: "#a78bfa",
    tagBg: "rgba(139,92,246,0.10)",
    tagBorder: "rgba(139,92,246,0.20)",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    title: "Pipeline Organizes Everything",
    description: "All your applications are organized in a beautiful pipeline. See at a glance which jobs need attention, what's in progress, and where you need to take action next.",
    highlight: "Visual pipeline · Smart action suggestions",
    gradientText: "linear-gradient(135deg, #4ade80, #22d3ee)",
    iconBg: "rgba(34,197,94,0.15)",
    iconColor: "#4ade80",
    borderColor: "rgba(34,197,94,0.20)",
    glowColor: "rgba(34,197,94,0.25)",
    dotColor: "#4ade80",
    tagBg: "rgba(34,197,94,0.10)",
    tagBorder: "rgba(34,197,94,0.20)",
  },
  {
    number: "04",
    icon: Zap,
    title: "AI Automates Follow-ups & Tracking",
    description: "AI-generated cover letters, automated follow-up emails, interview scheduling, and intelligent reminders all work in the background. You focus on interviews — we handle the rest.",
    highlight: "Fully automated · Save 10+ hours per week",
    gradientText: "linear-gradient(135deg, #fbbf24, #f97316)",
    iconBg: "rgba(245,158,11,0.15)",
    iconColor: "#fbbf24",
    borderColor: "rgba(245,158,11,0.20)",
    glowColor: "rgba(245,158,11,0.25)",
    dotColor: "#fbbf24",
    tagBg: "rgba(245,158,11,0.10)",
    tagBorder: "rgba(245,158,11,0.20)",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 mb-5">
            <Zap size={12} className="text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Simple 4-step process</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight" style={{ color: "var(--lp-t1)" }}>
            Up and running in
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #4ade80, #22d3ee)" }}
            >
              under 5 minutes
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "var(--lp-t3)" }}>
            Connect your accounts once. The AI handles everything else — from intake to follow-up.
          </p>
        </motion.div>

        <div className="relative">
          {/* Desktop connector line */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%+2.5rem)] right-[calc(12.5%+2.5rem)] h-px overflow-hidden">
            <div className="w-full h-full" style={{ background: "linear-gradient(90deg, #60a5fa44, #a78bfa44, #4ade8044, #fbbf2444)" }} />
            <motion.div
              className="absolute inset-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)", width: "30%" }}
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {STEPS.map(({ number, icon: Icon, title, description, highlight, gradientText, iconBg, iconColor, borderColor, glowColor, dotColor, tagBg, tagBorder }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
              >
                {/* Step icon + number */}
                <div className="relative flex items-center gap-4 mb-6">
                  <div className="relative shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: iconBg, border: `1px solid ${borderColor}`, boxShadow: `0 0 20px ${glowColor}` }}
                    >
                      <Icon size={18} style={{ color: iconColor }} />
                    </motion.div>
                    {/* Ping ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `1px solid ${iconColor}` }}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ background: dotColor, borderColor: "var(--lp-bg)" }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="text-5xl font-black bg-clip-text text-transparent leading-none" style={{ backgroundImage: gradientText }}>
                    {number}
                  </div>
                </div>

                {/* Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 rounded-2xl p-5"
                  style={{ background: "var(--lp-card)", border: `1px solid var(--lp-bd)`, boxShadow: "var(--lp-shadow-sm)" }}
                >
                  <h3 className="font-semibold text-base mb-3 leading-snug" style={{ color: "var(--lp-t1)" }}>{title}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--lp-t4)" }}>{description}</p>
                  <div
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full"
                    style={{ background: tagBg, border: `1px solid ${tagBorder}`, color: iconColor }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                    {highlight}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <motion.a
            href="/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-base"
            style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              boxShadow: "0 0 40px rgba(99,102,241,0.25), 0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            Get Started Free
            <Zap size={15} className="fill-white" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
