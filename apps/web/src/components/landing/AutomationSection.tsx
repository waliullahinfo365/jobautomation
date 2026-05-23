"use client";

import { motion } from "framer-motion";
import { Mail, Brain, Upload, FileText, Calendar, Bell, ArrowRight, Zap } from "lucide-react";

const PIPELINE_NODES = [
  {
    icon: Mail,
    label: "Gmail Inbox",
    sublabel: "Email detected",
    color: "from-red-500/30 to-orange-500/30",
    iconColor: "text-red-400",
    borderColor: "border-red-500/30",
    glowColor: "rgba(239,68,68,0.3)",
    dot: "bg-red-400",
  },
  {
    icon: Brain,
    label: "AI Analysis",
    sublabel: "Job scored & ranked",
    color: "from-blue-500/30 to-purple-500/30",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    glowColor: "rgba(59,130,246,0.3)",
    dot: "bg-blue-400",
  },
  {
    icon: Upload,
    label: "CV Routing",
    sublabel: "Best CV selected",
    color: "from-green-500/30 to-emerald-500/30",
    iconColor: "text-green-400",
    borderColor: "border-green-500/30",
    glowColor: "rgba(34,197,94,0.3)",
    dot: "bg-green-400",
  },
  {
    icon: FileText,
    label: "Cover Letter",
    sublabel: "AI personalized",
    color: "from-purple-500/30 to-pink-500/30",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    glowColor: "rgba(139,92,246,0.3)",
    dot: "bg-purple-400",
  },
  {
    icon: Calendar,
    label: "Calendar Sync",
    sublabel: "Interview scheduled",
    color: "from-cyan-500/30 to-blue-500/30",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    glowColor: "rgba(6,182,212,0.3)",
    dot: "bg-cyan-400",
  },
  {
    icon: Bell,
    label: "Follow-up",
    sublabel: "Auto-sent at right time",
    color: "from-amber-500/30 to-yellow-500/30",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    glowColor: "rgba(245,158,11,0.3)",
    dot: "bg-amber-400",
  },
];

const AUTOMATION_CARDS = [
  {
    title: "Intelligent Email Parsing",
    description: "AI reads every email and identifies job-related messages with 99.2% accuracy. No false positives, no missed opportunities.",
    metric: "99.2% accuracy",
    metricColor: "text-blue-400",
  },
  {
    title: "Zero-touch Application Flow",
    description: "From job detection to application submission — the entire process can run automatically while you focus on your actual work.",
    metric: "< 2 min per job",
    metricColor: "text-green-400",
  },
  {
    title: "Adaptive AI Learning",
    description: "The AI learns from your preferences and feedback, getting smarter about which jobs to prioritize and how to tailor your materials.",
    metric: "Improves daily",
    metricColor: "text-purple-400",
  },
];

export function AutomationSection() {
  return (
    <section className="py-24 border-t border-white/[0.05] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 mb-5">
            <Zap size={12} className="text-orange-400" />
            <span className="text-sm text-orange-300 font-medium">AI Automation Engine</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            Your job search runs on
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #fb923c, #f43f5e, #a78bfa)" }}
            >
              autopilot
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            The moment a job email lands in your Gmail, our AI engine kicks in. Every step — from analysis to follow-up — is automated.
          </p>
        </motion.div>

        {/* Pipeline flow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative mb-16"
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.08), transparent 70%)",
            }}
          />

          {/* Flow — desktop horizontal, mobile grid */}
          <div className="relative flex flex-wrap justify-center gap-3 lg:gap-0 lg:flex-nowrap lg:items-center">
            {PIPELINE_NODES.map(({ icon: Icon, label, sublabel, color, iconColor, borderColor, glowColor, dot }, i) => (
              <div key={label} className="flex items-center">
                {/* Node */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border ${borderColor} p-4 w-32 cursor-default group`}
                  style={{
                    background: `linear-gradient(135deg, ${color.replace("from-", "").replace("/30", "")})`,
                    boxShadow: `0 0 30px ${glowColor}`,
                  }}
                >
                  {/* Pulse ring */}
                  <div
                    className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `0 0 20px ${glowColor}` }}
                  />

                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} border ${borderColor} flex items-center justify-center`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold text-white leading-tight">{label}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{sublabel}</div>
                  </div>

                  {/* Active dot */}
                  <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full ${dot} border-2 border-[#030712]`}>
                    <div className={`absolute inset-0 rounded-full ${dot} animate-ping opacity-60`} />
                  </div>
                </motion.div>

                {/* Connector arrow */}
                {i < PIPELINE_NODES.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="hidden lg:flex items-center mx-1 shrink-0"
                  >
                    <div className="flex items-center gap-0.5">
                      {[0, 1, 2].map((j) => (
                        <motion.div
                          key={j}
                          className="w-1.5 h-1.5 rounded-full bg-slate-600"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.2 }}
                        />
                      ))}
                      <ArrowRight size={12} className="text-slate-500 ml-0.5" />
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Automation stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {AUTOMATION_CARDS.map(({ title, description, metric, metricColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/[0.08] p-6 hover:border-white/20 transition-all duration-300 group"
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              <div className={`text-2xl font-black mb-3 ${metricColor}`}>{metric}</div>
              <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>

        {/* Timeline log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/[0.08] overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">Automation Activity Log</span>
            </div>
            <span className="text-[10px] text-slate-500">Live · updating now</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[
              { time: "2 min ago", event: "Gmail scan complete", detail: "4 new job opportunities detected and imported", icon: "📬", color: "text-green-400" },
              { time: "8 min ago", event: "Cover letter generated", detail: "AI personalized letter for Stripe Senior Engineer role (94% match)", icon: "✍️", color: "text-blue-400" },
              { time: "15 min ago", event: "CV routed", detail: "Full-stack CV v3 selected and attached for Vercel application", icon: "📄", color: "text-purple-400" },
              { time: "1 hr ago", event: "Follow-up sent", detail: "Auto follow-up dispatched to Google recruiter (7 days post-apply)", icon: "📤", color: "text-amber-400" },
              { time: "3 hr ago", event: "Interview scheduled", detail: "Stripe technical interview added to Google Calendar for Jun 15", icon: "📅", color: "text-cyan-400" },
            ].map(({ time, event, detail, icon, color }) => (
              <div key={event} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <span className="text-base shrink-0 mt-0.5">{icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold ${color}`}>{event}</span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">{detail}</span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-600 shrink-0">{time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
