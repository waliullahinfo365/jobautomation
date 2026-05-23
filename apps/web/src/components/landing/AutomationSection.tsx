"use client";

import { motion } from "framer-motion";
import { Mail, Brain, Upload, FileText, Calendar, Bell, ArrowRight, Zap } from "lucide-react";

const NODES = [
  { icon: Mail, label: "Gmail Inbox", sublabel: "Email detected", iconColor: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.22)", glow: "rgba(239,68,68,0.25)", dot: "#f87171" },
  { icon: Brain, label: "AI Analysis", sublabel: "Job scored & ranked", iconColor: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.22)", glow: "rgba(59,130,246,0.25)", dot: "#60a5fa" },
  { icon: Upload, label: "CV Routing", sublabel: "Best CV selected", iconColor: "#4ade80", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.22)", glow: "rgba(34,197,94,0.25)", dot: "#4ade80" },
  { icon: FileText, label: "Cover Letter", sublabel: "AI personalized", iconColor: "#a78bfa", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.22)", glow: "rgba(139,92,246,0.25)", dot: "#a78bfa" },
  { icon: Calendar, label: "Calendar Sync", sublabel: "Interview scheduled", iconColor: "#22d3ee", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.22)", glow: "rgba(6,182,212,0.25)", dot: "#22d3ee" },
  { icon: Bell, label: "Follow-up", sublabel: "Auto-sent on time", iconColor: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.22)", glow: "rgba(245,158,11,0.25)", dot: "#fbbf24" },
];

const STATS = [
  { metric: "99.2%", label: "Email accuracy", description: "AI reads every email and identifies job-related messages with 99.2% accuracy. No false positives, no missed opportunities.", color: "#60a5fa" },
  { metric: "< 2 min", label: "Per job", description: "From job detection to application submission — the entire process can run automatically while you focus on your work.", color: "#4ade80" },
  { metric: "Daily", label: "AI learning", description: "The AI learns from your preferences and feedback, getting smarter about which jobs to prioritize and how to tailor your materials.", color: "#a78bfa" },
];

export function AutomationSection() {
  return (
    <section className="py-24 overflow-hidden" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 mb-5">
            <Zap size={12} className="text-orange-500" />
            <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">AI Automation Engine</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight" style={{ color: "var(--lp-t1)" }}>
            Your job search runs on
            <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #fb923c, #f43f5e, #a78bfa)" }}>
              autopilot
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "var(--lp-t3)" }}>
            The moment a job email lands in your Gmail, our AI engine kicks in. Every step — from analysis to follow-up — is automated.
          </p>
        </motion.div>

        {/* Pipeline flow */}
        <div className="relative mb-16">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 lg:gap-0 lg:flex lg:flex-nowrap lg:items-center justify-center">
            {NODES.map(({ icon: Icon, label, sublabel, iconColor, bg, border, glow, dot }, i) => (
              <div key={label} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.06, y: -4 }}
                  className="group relative flex flex-col items-center gap-2 rounded-2xl p-4 w-32 cursor-default"
                  style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 30px ${glow}` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${border}` }}>
                    <Icon size={18} style={{ color: iconColor }} />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold leading-tight" style={{ color: "var(--lp-t1)" }}>{label}</div>
                    <div className="text-[9px] mt-0.5 leading-tight" style={{ color: "var(--lp-t4)" }}>{sublabel}</div>
                  </div>
                  {/* Pulsing dot */}
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2" style={{ background: dot, borderColor: "var(--lp-bg)" }}>
                    <motion.div className="absolute inset-0 rounded-full" style={{ background: dot }} animate={{ scale: [1, 2], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }} />
                  </div>
                </motion.div>

                {/* Connector */}
                {i < NODES.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="hidden sm:flex items-center mx-1.5 shrink-0 gap-0.5"
                  >
                    {[0, 1, 2].map((j) => (
                      <motion.div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--lp-bd2)" }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }} />
                    ))}
                    <ArrowRight size={12} style={{ color: "var(--lp-t5)" }} className="ml-0.5" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {STATS.map(({ metric, label, description, color }, i) => (
            <motion.div
              key={metric}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-6"
              style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)", boxShadow: "var(--lp-shadow-sm)" }}
            >
              <div className="text-2xl font-black mb-1" style={{ color }}>{metric}</div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--lp-t4)" }}>{label}</div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--lp-t4)" }}>{description}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}
        >
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--lp-bd)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-semibold" style={{ color: "var(--lp-t1)" }}>Automation Activity Log</span>
            </div>
            <span className="text-[10px]" style={{ color: "var(--lp-t5)" }}>Live · updating now</span>
          </div>
          <div style={{ borderTop: "none" }}>
            {[
              { time: "2 min ago", event: "Gmail scan complete", detail: "4 new job opportunities detected and imported", icon: "📬", color: "#4ade80" },
              { time: "8 min ago", event: "Cover letter generated", detail: "AI personalized letter for Stripe Senior Engineer role (94% match)", icon: "✍️", color: "#60a5fa" },
              { time: "15 min ago", event: "CV routed", detail: "Full-stack CV v3 selected and attached for Vercel application", icon: "📄", color: "#a78bfa" },
              { time: "1 hr ago", event: "Follow-up sent", detail: "Auto follow-up dispatched to Google recruiter (7 days post-apply)", icon: "📤", color: "#fbbf24" },
              { time: "3 hr ago", event: "Interview scheduled", detail: "Stripe technical interview added to Google Calendar for Jun 15", icon: "📅", color: "#22d3ee" },
            ].map(({ time, event, detail, icon, color }, i) => (
              <motion.div
                key={event}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 px-5 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                style={{ borderTop: "1px solid var(--lp-bd3)" }}
              >
                <span className="text-base shrink-0 mt-0.5">{icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold" style={{ color }}>{event}</span>
                    <span className="text-[10px]" style={{ color: "var(--lp-t5)" }}>·</span>
                    <span className="text-[10px]" style={{ color: "var(--lp-t4)" }}>{detail}</span>
                  </div>
                </div>
                <span className="text-[9px] shrink-0" style={{ color: "var(--lp-t5)" }}>{time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
