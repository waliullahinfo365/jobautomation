"use client";

import { motion } from "framer-motion";
import {
  Mail, FileText, Calendar, Bell, BarChart3, Globe,
  Brain, Search, Shield, Sparkles, Upload, TrendingUp,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mail,
    title: "Gmail Auto-Detection",
    description: "Automatically detects job opportunities in your Gmail inbox and imports them into your pipeline — no manual entry ever.",
    color: "from-red-500/20 to-orange-500/20",
    iconColor: "text-red-400",
    borderColor: "border-red-500/20",
    glowColor: "rgba(239,68,68,0.15)",
  },
  {
    icon: Brain,
    title: "AI Job Intake",
    description: "Our AI analyzes each job posting, extracts key requirements, scores your match, and suggests the best application strategy.",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/20",
    glowColor: "rgba(59,130,246,0.15)",
  },
  {
    icon: Sparkles,
    title: "AI Cover Letters",
    description: "Generate personalized, human-sounding cover letters tailored to each specific role and company in seconds — not hours.",
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/20",
    glowColor: "rgba(139,92,246,0.15)",
  },
  {
    icon: Upload,
    title: "Google Drive CV Routing",
    description: "Automatically routes the right CV version to each application based on the role, industry, and required skills.",
    color: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-400",
    borderColor: "border-green-500/20",
    glowColor: "rgba(34,197,94,0.15)",
  },
  {
    icon: Calendar,
    title: "Interview Scheduling",
    description: "Sync interviews directly to Google Calendar. Get reminders, prep notes, and AI-generated questions for every interview.",
    color: "from-cyan-500/20 to-blue-500/20",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    glowColor: "rgba(6,182,212,0.15)",
  },
  {
    icon: Bell,
    title: "Follow-up Automation",
    description: "Never forget a follow-up. Set rules once and let the AI send perfectly timed follow-up emails that actually get replies.",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/20",
    glowColor: "rgba(245,158,11,0.15)",
  },
  {
    icon: BarChart3,
    title: "Application Analytics",
    description: "Track response rates, interview conversion, time-to-offer, and identify which strategies are landing you the most callbacks.",
    color: "from-indigo-500/20 to-purple-500/20",
    iconColor: "text-indigo-400",
    borderColor: "border-indigo-500/20",
    glowColor: "rgba(99,102,241,0.15)",
  },
  {
    icon: Globe,
    title: "Multi-language Support",
    description: "Apply to international roles with ease. Generate cover letters, emails, and application materials in 15+ languages.",
    color: "from-teal-500/20 to-green-500/20",
    iconColor: "text-teal-400",
    borderColor: "border-teal-500/20",
    glowColor: "rgba(20,184,166,0.15)",
  },
  {
    icon: TrendingUp,
    title: "Smart Weekly Reports",
    description: "Receive intelligent weekly digests showing your pipeline health, action items, and AI recommendations to improve your search.",
    color: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
    borderColor: "border-pink-500/20",
    glowColor: "rgba(236,72,153,0.15)",
  },
  {
    icon: Search,
    title: "AI Research Assistant",
    description: "Instantly research any company — culture, tech stack, recent news, salary benchmarks — so you always walk in prepared.",
    color: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/20",
    glowColor: "rgba(139,92,246,0.15)",
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Store and organize all your CVs, cover letters, portfolios, and certificates. Route the right document to the right application automatically.",
    color: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400",
    borderColor: "border-orange-500/20",
    glowColor: "rgba(249,115,22,0.15)",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Your data is encrypted at rest and in transit. We never sell your information. GDPR compliant. You own your data.",
    color: "from-slate-500/20 to-gray-500/20",
    iconColor: "text-slate-400",
    borderColor: "border-slate-500/20",
    glowColor: "rgba(100,116,139,0.15)",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 mb-5">
            <Sparkles size={12} className="text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Everything you need</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            The complete job search
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #60a5fa)" }}
            >
              automation platform
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Every tool you need to automate your job search, built into one intelligent platform. Stop wasting hours on admin work.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, color, iconColor, borderColor, glowColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`group relative rounded-2xl border ${borderColor} p-5 cursor-default transition-all duration-300 hover:border-opacity-60`}
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${glowColor}, transparent 70%)` }}
              />

              {/* Icon */}
              <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${color} border ${borderColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={18} className={iconColor} />
              </div>

              <h3 className="relative text-sm font-semibold text-white mb-2 group-hover:text-white">{title}</h3>
              <p className="relative text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors duration-200">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
