"use client";

import { motion } from "framer-motion";
import {
  Mail, FileText, Calendar, Bell, BarChart3, Globe,
  Brain, Search, Shield, Sparkles, Upload, TrendingUp,
} from "lucide-react";

const FEATURES = [
  { icon: Mail, title: "Gmail Auto-Detection", description: "Automatically detects job opportunities in your Gmail inbox and imports them into your pipeline — no manual entry ever.", colorAccent: "rgba(239,68,68,0.15)", iconColor: "#f87171", borderColor: "rgba(239,68,68,0.20)", glowColor: "rgba(239,68,68,0.10)" },
  { icon: Brain, title: "AI Job Intake", description: "AI analyzes each job posting, extracts key requirements, scores your match, and suggests the best application strategy.", colorAccent: "rgba(59,130,246,0.15)", iconColor: "#60a5fa", borderColor: "rgba(59,130,246,0.20)", glowColor: "rgba(59,130,246,0.10)" },
  { icon: Sparkles, title: "AI Cover Letters", description: "Generate personalized, human-sounding cover letters tailored to each specific role and company in seconds — not hours.", colorAccent: "rgba(139,92,246,0.15)", iconColor: "#a78bfa", borderColor: "rgba(139,92,246,0.20)", glowColor: "rgba(139,92,246,0.10)" },
  { icon: Upload, title: "Google Drive CV Routing", description: "Automatically routes the right CV version to each application based on the role, industry, and required skills.", colorAccent: "rgba(34,197,94,0.15)", iconColor: "#4ade80", borderColor: "rgba(34,197,94,0.20)", glowColor: "rgba(34,197,94,0.10)" },
  { icon: Calendar, title: "Interview Scheduling", description: "Sync interviews directly to Google Calendar. Get reminders, prep notes, and AI-generated questions for every interview.", colorAccent: "rgba(6,182,212,0.15)", iconColor: "#22d3ee", borderColor: "rgba(6,182,212,0.20)", glowColor: "rgba(6,182,212,0.10)" },
  { icon: Bell, title: "Follow-up Automation", description: "Never forget a follow-up. Set rules once and let the AI send perfectly timed follow-up emails that actually get replies.", colorAccent: "rgba(245,158,11,0.15)", iconColor: "#fbbf24", borderColor: "rgba(245,158,11,0.20)", glowColor: "rgba(245,158,11,0.10)" },
  { icon: BarChart3, title: "Application Analytics", description: "Track response rates, interview conversion, time-to-offer, and identify which strategies are landing you the most callbacks.", colorAccent: "rgba(99,102,241,0.15)", iconColor: "#818cf8", borderColor: "rgba(99,102,241,0.20)", glowColor: "rgba(99,102,241,0.10)" },
  { icon: Globe, title: "Multi-language Support", description: "Apply to international roles with ease. Generate cover letters, emails, and application materials in 15+ languages.", colorAccent: "rgba(20,184,166,0.15)", iconColor: "#2dd4bf", borderColor: "rgba(20,184,166,0.20)", glowColor: "rgba(20,184,166,0.10)" },
  { icon: TrendingUp, title: "Smart Weekly Reports", description: "Receive intelligent weekly digests showing pipeline health, action items, and AI recommendations to improve your search.", colorAccent: "rgba(236,72,153,0.15)", iconColor: "#f472b6", borderColor: "rgba(236,72,153,0.20)", glowColor: "rgba(236,72,153,0.10)" },
  { icon: Search, title: "AI Research Assistant", description: "Instantly research any company — culture, tech stack, recent news, salary benchmarks — so you always walk in prepared.", colorAccent: "rgba(139,92,246,0.15)", iconColor: "#c4b5fd", borderColor: "rgba(139,92,246,0.20)", glowColor: "rgba(139,92,246,0.10)" },
  { icon: FileText, title: "Document Management", description: "Store and organize all your CVs, cover letters, portfolios, and certificates. Route the right document to each application automatically.", colorAccent: "rgba(249,115,22,0.15)", iconColor: "#fb923c", borderColor: "rgba(249,115,22,0.20)", glowColor: "rgba(249,115,22,0.10)" },
  { icon: Shield, title: "Privacy & Security", description: "All data encrypted at rest and in transit. GDPR compliant. We never sell your information. You own your data — always.", colorAccent: "rgba(100,116,139,0.15)", iconColor: "#94a3b8", borderColor: "rgba(100,116,139,0.20)", glowColor: "rgba(100,116,139,0.10)" },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 mb-5">
            <Sparkles size={12} className="text-purple-500" />
            <span className="text-sm text-purple-500 font-medium">Everything you need</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight" style={{ color: "var(--lp-t1)" }}>
            The complete job search
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #60a5fa)" }}
            >
              automation platform
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--lp-t3)" }}>
            Every tool you need to automate your job search, built into one intelligent platform. Stop wasting hours on admin work.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, colorAccent, iconColor, borderColor, glowColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl p-5 cursor-default"
              style={{
                background: "var(--lp-card)",
                border: `1px solid var(--lp-bd)`,
                boxShadow: "var(--lp-shadow-sm)",
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${glowColor}, transparent 70%)` }}
              />

              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ duration: 0.2 }}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: colorAccent, border: `1px solid ${borderColor}` }}
              >
                <Icon size={18} style={{ color: iconColor }} />
              </motion.div>

              <h3 className="relative text-sm font-semibold mb-2 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--lp-t1)" }}>{title}</h3>
              <p className="relative text-xs leading-relaxed" style={{ color: "var(--lp-t4)" }}>{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
