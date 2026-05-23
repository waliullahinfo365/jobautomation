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
    color: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/20",
    dotColor: "bg-blue-400",
    glowColor: "rgba(59,130,246,0.2)",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Detects & Analyzes Jobs",
    description: "Our AI engine scans your emails, identifies job opportunities, scores them against your profile, and instantly imports them into your organized pipeline. Zero manual entry.",
    highlight: "Powered by advanced AI · Scores match to your CV",
    color: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/20",
    dotColor: "bg-purple-400",
    glowColor: "rgba(139,92,246,0.2)",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    title: "Pipeline Organizes Everything",
    description: "All your applications are organized in a beautiful pipeline. See at a glance which jobs need attention, what's in progress, and where you need to take action next. AI suggests next steps.",
    highlight: "Visual pipeline · Smart action suggestions",
    color: "from-green-500 to-emerald-500",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    borderColor: "border-green-500/20",
    dotColor: "bg-green-400",
    glowColor: "rgba(34,197,94,0.2)",
  },
  {
    number: "04",
    icon: Zap,
    title: "AI Automates Follow-ups & Tracking",
    description: "AI-generated cover letters, automated follow-up emails, interview scheduling, and intelligent reminders all work in the background. You focus on interviews — we handle the rest.",
    highlight: "Fully automated · Save 10+ hours per week",
    color: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/20",
    dotColor: "bg-amber-400",
    glowColor: "rgba(245,158,11,0.2)",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 mb-5">
            <Zap size={12} className="text-green-400" />
            <span className="text-sm text-green-300 font-medium">Simple 4-step process</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            Up and running in
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #4ade80, #22d3ee)" }}
            >
              under 5 minutes
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Connect your accounts once. The AI handles everything else — from intake to follow-up.
          </p>
        </motion.div>

        {/* Steps — desktop: horizontal connected timeline, mobile: vertical stacked */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px">
            <div className="w-full h-full bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-amber-500/50" />
            {/* Animated glow */}
            <motion.div
              className="absolute inset-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            />
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {STEPS.map(({ number, icon: Icon, title, description, highlight, color, iconBg, iconColor, borderColor, dotColor, glowColor }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="flex flex-col"
              >
                {/* Step dot + number */}
                <div className="relative flex items-center gap-4 mb-6">
                  {/* Glowing dot */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full ${iconBg} border ${borderColor} flex items-center justify-center`}
                      style={{ boxShadow: `0 0 20px ${glowColor}` }}
                    >
                      <Icon size={18} className={iconColor} />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${dotColor} border-2 border-[#030712] flex items-center justify-center`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>

                  <div
                    className="text-5xl font-black bg-clip-text text-transparent leading-none"
                    style={{ backgroundImage: `linear-gradient(135deg, ${color.includes("blue") ? "#3b82f6,#06b6d4" : color.includes("purple") ? "#8b5cf6,#ec4899" : color.includes("green") ? "#22c55e,#10b981" : "#f59e0b,#f97316"})` }}
                  >
                    {number}
                  </div>
                </div>

                {/* Content card */}
                <div
                  className={`flex-1 rounded-2xl border ${borderColor} p-5 transition-all duration-300 hover:border-opacity-60 group`}
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  <h3 className="font-semibold text-white text-base mb-3 leading-snug">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{description}</p>
                  <div
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-gradient-to-r ${color} bg-opacity-10`}
                    style={{ background: `linear-gradient(135deg, ${glowColor}, transparent)`, border: `1px solid ${glowColor}` }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span className={iconColor}>{highlight}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-base hover:opacity-90 hover:scale-105 active:scale-100 transition-all shadow-lg"
            style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              boxShadow: "0 0 40px rgba(99,102,241,0.25), 0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            Get Started Free
            <Zap size={15} className="fill-white" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
