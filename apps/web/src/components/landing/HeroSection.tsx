"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { useLandingTheme } from "./LandingThemeContext";

// ── Floating particles ────────────────────────────────────────────────────────

function Particles() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 12 + 8,
    delay: Math.random() * 6,
    opacity: Math.random() * 0.5 + 0.15,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(({ id, x, y, size, duration, delay, opacity }) => (
        <motion.div
          key={id}
          className="absolute rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            background: "var(--lp-particle)",
            opacity,
          }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 8, 0],
            opacity: [opacity, opacity * 1.8, opacity * 0.6, opacity * 1.4, opacity],
            scale: [1, 1.3, 0.8, 1.1, 1],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Grid background ───────────────────────────────────────────────────────────

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(var(--lp-grid) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          opacity: "var(--lp-grid-o)",
        }}
      />
      {/* Center radial glow */}
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px]"
        style={{ background: `radial-gradient(ellipse at center, var(--lp-hero-glow) 0%, var(--lp-hero-glow2) 35%, transparent 70%)` }}
      />
      <div
        className="absolute top-[30%] -left-[20%] w-[600px] h-[600px] opacity-60"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-[20%] -right-[15%] w-[500px] h-[500px] opacity-50"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)" }}
      />
    </div>
  );
}

// ── Beam sweep ────────────────────────────────────────────────────────────────

function BeamEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-0 h-px w-[300px]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(168,85,247,0.6), transparent)",
          top: "35%",
        }}
        animate={{ x: ["-30vw", "130vw"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
      />
      <motion.div
        className="absolute h-px w-[200px]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)",
          top: "60%",
        }}
        animate={{ x: ["130vw", "-30vw"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 2, delay: 3 }}
      />
    </div>
  );
}

// ── Cursor glow ───────────────────────────────────────────────────────────────

function CursorGlow() {
  const { isDark } = useLandingTheme();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 60, damping: 18 });
  const y = useSpring(my, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const move = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  return (
    <motion.div
      className="fixed pointer-events-none z-0"
      style={{
        x, y,
        width: 400,
        height: 400,
        translateX: "-50%",
        translateY: "-50%",
        background: isDark
          ? "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)",
        borderRadius: "50%",
      }}
    />
  );
}

// ── Dashboard mockup ──────────────────────────────────────────────────────────

function DashboardMockup() {
  const statCards = [
    { label: "Active Jobs", value: "24", change: "+3 this week", c: "#60a5fa" },
    { label: "Applied", value: "8", change: "+2 this week", c: "#4ade80" },
    { label: "Interviews", value: "3", change: "+1 today", c: "#a78bfa" },
    { label: "AI Drafts", value: "12", change: "+5 this week", c: "#22d3ee" },
  ];

  const jobRows = [
    { co: "Stripe", pos: "Senior Software Engineer", status: "Interview", sc: "rgba(139,92,246,0.15)", tc: "#a78bfa" },
    { co: "Vercel", pos: "Full Stack Developer", status: "Applied", sc: "rgba(59,130,246,0.15)", tc: "#60a5fa" },
    { co: "Linear", pos: "Frontend Engineer", status: "AI Draft Ready", sc: "rgba(34,197,94,0.15)", tc: "#4ade80" },
    { co: "Notion", pos: "Backend Engineer", status: "Researching", sc: "rgba(245,158,11,0.15)", tc: "#fbbf24" },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 px-4">
      {/* Halo glow */}
      <div
        className="absolute inset-0 -z-10 blur-3xl"
        style={{ background: "radial-gradient(ellipse at 50% 70%, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.10) 50%, transparent 80%)" }}
      />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--lp-bg2)",
          border: "1px solid var(--lp-bd)",
          boxShadow: "var(--lp-shadow-lg)",
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ background: "var(--lp-card2)", borderBottom: "1px solid var(--lp-bd)" }}
        >
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
          <div
            className="ml-4 flex-1 max-w-xs h-6 rounded-md flex items-center px-3 gap-2"
            style={{ background: "var(--lp-card)" }}
          >
            <div className="w-2 h-2 rounded-full bg-green-400/60" />
            <span className="text-[10px]" style={{ color: "var(--lp-t4)" }}>app.newjobguru.com/dashboard</span>
          </div>
        </div>

        <div className="flex min-h-[340px]">
          {/* Sidebar */}
          <div
            className="hidden sm:flex flex-col w-36 p-3 gap-0.5 shrink-0"
            style={{ background: "var(--lp-card3)", borderRight: "1px solid var(--lp-bd3)" }}
          >
            <div className="text-[9px] font-semibold uppercase tracking-wider px-2 py-1.5" style={{ color: "var(--lp-t5)" }}>Navigation</div>
            {["Dashboard", "My Jobs", "Applications", "Documents", "Interviews", "Insights"].map((item, i) => (
              <div
                key={item}
                className="text-[11px] px-2.5 py-1.5 rounded-lg cursor-default"
                style={
                  i === 0
                    ? { background: "rgba(59,130,246,0.15)", color: "#60a5fa", fontWeight: 500 }
                    : { color: "var(--lp-t4)" }
                }
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 p-4 space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px]" style={{ color: "var(--lp-t4)" }}>Good morning, Alex 👋</div>
                <div className="text-sm font-semibold" style={{ color: "var(--lp-t1)" }}>Job Search Dashboard</div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border" style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", borderColor: "rgba(34,197,94,0.25)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AI Active
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statCards.map(({ label, value, change, c }) => (
                <div key={label} className="rounded-xl p-2.5" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}>
                  <div className="text-[9px] font-medium" style={{ color: "var(--lp-t4)" }}>{label}</div>
                  <div className="text-xl font-bold mt-0.5 tabular-nums" style={{ color: "var(--lp-t1)" }}>{value}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: c }}>{change}</div>
                </div>
              ))}
            </div>

            {/* Jobs table */}
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid var(--lp-bd3)" }}>
                <span className="text-[10px] font-semibold" style={{ color: "var(--lp-t3)" }}>Recent Applications</span>
                <span className="text-[9px] text-blue-500 cursor-pointer">View all →</span>
              </div>
              {jobRows.map(({ co, pos, status, sc, tc }) => (
                <div key={co} className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--lp-bd3)" }}>
                  <div>
                    <div className="text-[11px] font-medium" style={{ color: "var(--lp-t1)" }}>{pos}</div>
                    <div className="text-[9px]" style={{ color: "var(--lp-t4)" }}>{co}</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: sc, color: tc }}>{status}</span>
                </div>
              ))}
            </div>

            {/* AI row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 text-blue-500">AI Cover Letter</div>
                <div className="text-[10px] mb-2 leading-relaxed" style={{ color: "var(--lp-t3)" }}>Personalizing for Stripe Senior Engineer role…</div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }}
                    initial={{ width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{ delay: 1.2, duration: 1.8, ease: "easeOut" }}
                  />
                </div>
                <div className="text-[8px] mt-1" style={{ color: "var(--lp-t5)" }}>78% complete</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 text-green-500">Gmail Intake</div>
                <div className="text-[10px] mb-2" style={{ color: "var(--lp-t3)" }}>4 new opportunities detected today</div>
                <div className="flex flex-wrap gap-1">
                  {["Google", "Airbnb", "Figma", "Shopify"].map((co) => (
                    <span key={co} className="text-[8px] px-1.5 py-0.5 rounded-full text-green-600 dark:text-green-400" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.20)" }}>{co}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating card: Interview */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -left-2 lg:-left-10 top-1/4 rounded-2xl p-3.5 w-44 hidden lg:block"
        style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "var(--lp-shadow)", backdropFilter: "blur(20px)" }}
      >
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.25)" }}>
              <CheckCircle2 size={13} className="text-purple-500" />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>Interview Set!</span>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--lp-t3)" }}>Google SWE · Tomorrow 2:00 PM</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-[9px] text-purple-500">Calendar synced</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating card: AI Draft */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute -right-2 lg:-right-10 top-1/3 rounded-2xl p-3.5 w-48 hidden lg:block"
        style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "var(--lp-shadow)", backdropFilter: "blur(20px)" }}
      >
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: "rgba(59,130,246,0.15)", borderColor: "rgba(59,130,246,0.25)" }}>
              <Sparkles size={13} className="text-blue-500" />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>AI Generated</span>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--lp-t3)" }}>Cover letter ready — Stripe Engineering</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-[9px] text-blue-500">94% match score</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating card: Follow-up */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute -right-2 lg:-right-8 bottom-16 rounded-2xl p-3.5 w-44 hidden xl:block"
        style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "var(--lp-shadow)", backdropFilter: "blur(20px)" }}
      >
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.25)" }}>
              <TrendingUp size={13} className="text-green-500" />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>Follow-up Sent</span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--lp-t3)" }}>Auto-sent to Vercel recruiter</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[9px] text-green-500">Automated</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────

const HEADLINE_WORDS = ["Your", "AI-Powered", "Job", "Search", "Command", "Center"];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start pt-28 pb-20 overflow-hidden">
      <GridBackground />
      <Particles />
      <BeamEffect />
      <CursorGlow />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-8 cursor-default"
        >
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
            <Sparkles size={12} className="text-blue-500" />
          </motion.div>
          <span className="text-sm text-blue-500 font-medium">AI-Powered Job Application Automation</span>
          <span className="inline-flex px-1.5 py-0.5 rounded-full bg-blue-500/20 text-[10px] text-blue-500 font-bold border border-blue-500/30">NEW</span>
        </motion.div>

        {/* Word-by-word headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-[72px] font-bold leading-[1.06] tracking-tight mb-6">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={i >= 2
                  ? "bg-clip-text text-transparent"
                  : undefined}
                style={
                  i >= 2
                    ? { backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #22d3ee 100%)", color: i < 2 ? "var(--lp-t1)" : undefined }
                    : { color: "var(--lp-t1)" }
                }
              >
                {word}
              </motion.span>
            ))}
          </div>
        </h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--lp-t3)" }}
        >
          Track applications, organize interviews, generate AI-powered cover letters, automate follow-ups, and manage your entire job pipeline from one intelligent workspace.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/login"
              className="group flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold text-base"
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                boxShadow: "0 0 40px rgba(99,102,241,0.35), 0 4px 20px rgba(0,0,0,0.25)",
              }}
            >
              Start Free — No Credit Card
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-base transition-colors"
              style={{
                color: "var(--lp-t2)",
                border: "1px solid var(--lp-bd2)",
                background: "var(--lp-card)",
              }}
            >
              View Demo
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 mb-6"
        >
          {[
            { icon: TrendingUp, iconClass: "text-green-500", stat: "10,000+", label: "applications tracked" },
            { icon: Zap, iconClass: "text-blue-500", stat: "95%", label: "automation success rate" },
            { icon: CheckCircle2, iconClass: "text-purple-500", stat: "4x faster", label: "job search workflow" },
          ].map(({ icon: Icon, iconClass, stat, label }, i) => (
            <motion.div
              key={stat}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className="flex items-center gap-2"
              style={{ color: "var(--lp-t3)" }}
            >
              <Icon size={15} className={iconClass} />
              <span className="text-sm">
                <span className="font-semibold" style={{ color: "var(--lp-t1)" }}>{stat}</span> {label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-xs mb-4"
          style={{ color: "var(--lp-t5)" }}
        >
          Trusted by job seekers worldwide · Privacy first · Cancel anytime
        </motion.p>

        {/* Dashboard mockup */}
        <DashboardMockup />
      </div>
    </section>
  );
}
