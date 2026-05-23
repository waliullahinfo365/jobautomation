"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2, TrendingUp, Zap } from "lucide-react";

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />
      <div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] opacity-30"
        style={{
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.35) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[30%] -left-[20%] w-[600px] h-[600px] opacity-20"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-[20%] -right-[15%] w-[500px] h-[500px] opacity-15"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)" }}
      />
    </div>
  );
}

function DashboardMockup() {
  const statCards = [
    { label: "Active Jobs", value: "24", change: "+3 this week", changeClass: "text-blue-400" },
    { label: "Applied", value: "8", change: "+2 this week", changeClass: "text-green-400" },
    { label: "Interviews", value: "3", change: "+1 today", changeClass: "text-purple-400" },
    { label: "AI Drafts", value: "12", change: "+5 this week", changeClass: "text-cyan-400" },
  ];

  const jobRows = [
    { co: "Stripe", pos: "Senior Software Engineer", status: "Interview Scheduled", statusClass: "bg-purple-500/20 text-purple-300" },
    { co: "Vercel", pos: "Full Stack Developer", status: "Applied", statusClass: "bg-blue-500/20 text-blue-300" },
    { co: "Linear", pos: "Frontend Engineer", status: "AI Draft Ready", statusClass: "bg-green-500/20 text-green-300" },
    { co: "Notion", pos: "Backend Engineer", status: "Researching", statusClass: "bg-amber-500/20 text-amber-300" },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 px-4">
      {/* Glow halo */}
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-40"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0.2) 50%, transparent 80%)" }}
      />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
        style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(9,14,30,0.98) 100%)" }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <div className="ml-4 flex-1 max-w-xs h-6 bg-white/[0.06] rounded-md flex items-center px-3 gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400/60" />
            <span className="text-[10px] text-slate-500">app.newjobguru.com/dashboard</span>
          </div>
        </div>

        <div className="flex min-h-[340px]">
          {/* Sidebar */}
          <div className="hidden sm:flex flex-col w-36 border-r border-white/[0.06] p-3 gap-0.5 shrink-0" style={{ background: "rgba(255,255,255,0.015)" }}>
            <div className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider px-2 py-1.5">Navigation</div>
            {["Dashboard", "My Jobs", "Applications", "Documents", "Interviews", "Insights"].map((item, i) => (
              <div
                key={item}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg cursor-default transition-colors ${
                  i === 0
                    ? "bg-blue-600/20 text-blue-300 font-medium"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 p-4 space-y-3 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500">Good morning, Alex 👋</div>
                <div className="text-sm font-semibold text-white">Job Search Dashboard</div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AI Active
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statCards.map(({ label, value, change, changeClass }) => (
                <div key={label} className="rounded-xl border border-white/[0.07] p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-[9px] text-slate-500 font-medium">{label}</div>
                  <div className="text-xl font-bold text-white mt-0.5 tabular-nums">{value}</div>
                  <div className={`text-[9px] mt-0.5 ${changeClass}`}>{change}</div>
                </div>
              ))}
            </div>

            {/* Jobs table */}
            <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">Recent Applications</span>
                <span className="text-[9px] text-blue-400 cursor-pointer">View all →</span>
              </div>
              {jobRows.map(({ co, pos, status, statusClass }) => (
                <div key={co} className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <div>
                    <div className="text-[11px] font-medium text-white">{pos}</div>
                    <div className="text-[9px] text-slate-500">{co}</div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusClass}`}>{status}</span>
                </div>
              ))}
            </div>

            {/* AI row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-blue-500/20 p-3" style={{ background: "rgba(59,130,246,0.06)" }}>
                <div className="text-[9px] text-blue-400 font-semibold uppercase tracking-wider mb-1.5">AI Cover Letter</div>
                <div className="text-[10px] text-slate-400 mb-2 leading-relaxed line-clamp-2">Personalizing for Stripe Senior Engineer role…</div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }}
                    initial={{ width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{ delay: 1.2, duration: 1.8, ease: "easeOut" }}
                  />
                </div>
                <div className="text-[8px] text-slate-500 mt-1">78% complete</div>
              </div>
              <div className="rounded-xl border border-green-500/20 p-3" style={{ background: "rgba(34,197,94,0.05)" }}>
                <div className="text-[9px] text-green-400 font-semibold uppercase tracking-wider mb-1.5">Gmail Intake</div>
                <div className="text-[10px] text-slate-400 mb-2">4 new opportunities detected today</div>
                <div className="flex flex-wrap gap-1">
                  {["Google", "Airbnb", "Figma", "Shopify"].map((co) => (
                    <span key={co} className="text-[8px] px-1.5 py-0.5 bg-green-500/15 text-green-400 rounded-full border border-green-500/20">{co}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating card — Interview */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -left-2 lg:-left-10 top-1/4 rounded-2xl border border-white/10 p-3.5 shadow-2xl shadow-black/40 w-44 hidden lg:block"
        style={{ background: "rgba(9,14,30,0.95)", backdropFilter: "blur(20px)" }}
      >
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <CheckCircle2 size={13} className="text-purple-400" />
            </div>
            <span className="text-[11px] font-semibold text-white">Interview Set!</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">Google SWE · Tomorrow at 2:00 PM</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-[9px] text-purple-400">Calendar synced</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating card — AI Draft */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute -right-2 lg:-right-10 top-1/3 rounded-2xl border border-white/10 p-3.5 shadow-2xl shadow-black/40 w-48 hidden lg:block"
        style={{ background: "rgba(9,14,30,0.95)", backdropFilter: "blur(20px)" }}
      >
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Sparkles size={13} className="text-blue-400" />
            </div>
            <span className="text-[11px] font-semibold text-white">AI Generated</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">Cover letter ready for Stripe Engineering role</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-[9px] text-blue-400">Personalized · 94% match</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating card — Follow-up */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute -right-2 lg:-right-8 bottom-16 rounded-2xl border border-white/10 p-3.5 shadow-2xl shadow-black/40 w-44 hidden xl:block"
        style={{ background: "rgba(9,14,30,0.95)", backdropFilter: "blur(20px)" }}
      >
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <TrendingUp size={13} className="text-green-400" />
            </div>
            <span className="text-[11px] font-semibold text-white">Follow-up Sent</span>
          </div>
          <p className="text-[10px] text-slate-400">Auto-sent to Vercel recruiter</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[9px] text-green-400">Automated</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start pt-28 pb-20 overflow-hidden">
      <GridBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-8 cursor-default"
        >
          <Sparkles size={12} className="text-blue-400" />
          <span className="text-sm text-blue-300 font-medium">AI-Powered Job Application Automation</span>
          <span className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-[10px] text-blue-300 font-semibold">NEW</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl lg:text-[72px] font-bold leading-[1.06] tracking-tight mb-6"
        >
          <span className="text-white">Your AI-Powered</span>
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #22d3ee 100%)" }}
          >
            Job Search Command Center
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Track applications, organize interviews, generate AI-powered cover letters, automate follow-ups, and manage your entire job pipeline from one intelligent workspace.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Link
            href="/login"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-base transition-all shadow-lg hover:scale-105 active:scale-100"
            style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              boxShadow: "0 0 40px rgba(99,102,241,0.3), 0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            Start Free — No Credit Card
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/20 text-white font-semibold text-base hover:bg-white/5 hover:border-white/40 transition-all"
          >
            View Demo
          </Link>
        </motion.div>

        {/* Trust stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 mb-6"
        >
          {[
            { icon: TrendingUp, iconClass: "text-green-400", stat: "10,000+", label: "applications tracked" },
            { icon: Zap, iconClass: "text-blue-400", stat: "95%", label: "automation success rate" },
            { icon: CheckCircle2, iconClass: "text-purple-400", stat: "4x faster", label: "job search workflow" },
          ].map(({ icon: Icon, iconClass, stat, label }) => (
            <div key={stat} className="flex items-center gap-2 text-slate-400">
              <Icon size={15} className={iconClass} />
              <span className="text-sm">
                <span className="text-white font-semibold">{stat}</span> {label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-slate-600 mb-4"
        >
          Trusted by job seekers worldwide · Privacy first · Cancel anytime
        </motion.p>

        {/* Dashboard mockup */}
        <DashboardMockup />
      </div>
    </section>
  );
}
