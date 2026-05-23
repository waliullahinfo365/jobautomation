"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useLandingTheme } from "./LandingThemeContext";

// ── Aurora background ─────────────────────────────────────────────────────────

function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Aurora orb 1 — blue, top left */}
      <motion.div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: 700, height: 700,
          top: "-20%", left: "-10%",
          background: "radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(99,102,241,0.12) 50%, transparent 70%)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 25, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Aurora orb 2 — purple, top right */}
      <motion.div
        className="absolute rounded-full blur-[100px]"
        style={{
          width: 600, height: 600,
          top: "0%", right: "-8%",
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(168,85,247,0.1) 50%, transparent 70%)",
        }}
        animate={{ x: [0, -50, 20, 0], y: [0, 40, -30, 0], scale: [1, 0.92, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Aurora orb 3 — cyan, bottom center */}
      <motion.div
        className="absolute rounded-full blur-[80px]"
        style={{
          width: 500, height: 500,
          bottom: "0%", left: "30%",
          background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
        }}
        animate={{ x: [0, 30, -40, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />

      {/* Spotlight — center top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px]"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.13) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)" }}
      />
    </div>
  );
}

// ── Floating particles ────────────────────────────────────────────────────────

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 1,
    duration: Math.random() * 14 + 10,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.4 + 0.1,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(({ id, x, y, size, duration, delay, opacity }) => (
        <motion.div
          key={id}
          className="absolute rounded-full"
          style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: "var(--lp-particle)", opacity }}
          animate={{ y: [0, -28, 12, -18, 0], x: [0, 12, -8, 10, 0], opacity: [opacity, opacity * 2, opacity * 0.5, opacity * 1.5, opacity] }}
          transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Beam sweep ────────────────────────────────────────────────────────────────

function BeamEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute h-px w-[280px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.7), rgba(168,85,247,0.7), transparent)", top: "32%" }}
        animate={{ x: ["-40vw", "140vw"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
      />
      <motion.div
        className="absolute h-px w-[180px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)", top: "68%" }}
        animate={{ x: ["140vw", "-40vw"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear", repeatDelay: 3, delay: 4 }}
      />
    </div>
  );
}

// ── Cursor glow (desktop only) ────────────────────────────────────────────────

function CursorGlow() {
  const { isDark } = useLandingTheme();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 55, damping: 20 });
  const y = useSpring(my, { stiffness: 55, damping: 20 });
  useEffect(() => {
    const move = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);
  return (
    <motion.div
      className="fixed pointer-events-none z-0 hidden md:block"
      style={{
        x, y, width: 480, height: 480,
        translateX: "-50%", translateY: "-50%",
        background: isDark
          ? "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
        borderRadius: "50%",
      }}
    />
  );
}

// ── Rotating outcome phrase ───────────────────────────────────────────────────

const OUTCOMES = ["your dream role", "a job you love", "your next chapter", "that big promotion"];

function RotatingOutcome() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % OUTCOMES.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block" style={{ minWidth: "14ch" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 18, opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -18, opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 whitespace-nowrap"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 40%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {OUTCOMES[index]}
        </motion.span>
      </AnimatePresence>
      <span aria-hidden className="invisible">{OUTCOMES[0]}</span>
    </span>
  );
}

// ── Mobile app preview ────────────────────────────────────────────────────────

function MobileAppPreview() {
  const items = [
    { co: "Stripe", pos: "Senior Software Engineer", status: "Interview ✓", sc: "rgba(139,92,246,0.15)", tc: "#a78bfa" },
    { co: "Vercel", pos: "Full Stack Developer", status: "Applied", sc: "rgba(59,130,246,0.15)", tc: "#60a5fa" },
    { co: "Linear", pos: "Frontend Engineer", status: "AI Draft Ready", sc: "rgba(34,197,94,0.15)", tc: "#4ade80" },
  ];

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="w-full rounded-2xl overflow-hidden"
      style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd)", boxShadow: "0 0 60px rgba(99,102,241,0.2), var(--lp-shadow-lg)" }}
    >
      {/* Chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: "var(--lp-card2)", borderBottom: "1px solid var(--lp-bd)" }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="ml-3 flex items-center gap-1.5 flex-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
          <span className="text-[10px]" style={{ color: "var(--lp-t4)" }}>app.newjobguru.com</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
          <motion.div className="w-1 h-1 rounded-full bg-green-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          AI Live
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Jobs", value: "24", c: "#60a5fa" },
            { label: "Applied", value: "8", c: "#4ade80" },
            { label: "Interview", value: "3", c: "#a78bfa" },
            { label: "AI Drafts", value: "12", c: "#22d3ee" },
          ].map(({ label, value, c }) => (
            <div key={label} className="rounded-xl p-2 text-center" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}>
              <div className="text-base font-bold tabular-nums" style={{ color: c }}>{value}</div>
              <div className="text-[9px] mt-0.5" style={{ color: "var(--lp-t4)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Applications list */}
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--lp-bd3)" }}>
            <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t2)" }}>My Applications</span>
            <span className="text-[10px] text-blue-500">3 active →</span>
          </div>
          {items.map(({ co, pos, status, sc, tc }) => (
            <div key={co} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--lp-bd3)" }}>
              <div className="min-w-0 flex-1 mr-2">
                <div className="text-[12px] font-semibold truncate" style={{ color: "var(--lp-t1)" }}>{pos}</div>
                <div className="text-[10px]" style={{ color: "var(--lp-t4)" }}>{co}</div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full font-medium shrink-0" style={{ background: sc, color: tc }}>{status}</span>
            </div>
          ))}
        </div>

        {/* AI cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0 mt-0.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <div>
              <div className="text-[10px] font-semibold text-blue-500">AI Cover Letter</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--lp-t3)" }}>Stripe · 94% match</div>
              <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ delay: 1.2, duration: 1.5 }} />
              </div>
            </div>
          </div>
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 shrink-0 mt-0.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2 4 12 13 22 4"/></svg>
            <div>
              <div className="text-[10px] font-semibold text-green-500">Gmail Intake</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--lp-t3)" }}>4 new jobs found</div>
              <div className="mt-1.5 flex gap-1 flex-wrap">
                {["Google", "Airbnb"].map((co) => (
                  <span key={co} className="text-[9px] px-1.5 py-0.5 rounded-full text-green-600" style={{ background: "rgba(34,197,94,0.15)" }}>{co}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Desktop mockup ────────────────────────────────────────────────────────────

function DesktopMockup() {
  const statCards = [
    { label: "Active Jobs", value: "24", change: "+3 this week", c: "#60a5fa" },
    { label: "Applied", value: "8", change: "+2 this week", c: "#4ade80" },
    { label: "Interviews", value: "3", change: "+1 today", c: "#a78bfa" },
    { label: "AI Drafts", value: "12", change: "+5 this week", c: "#22d3ee" },
  ];
  const jobRows = [
    { co: "Stripe", pos: "Senior Software Engineer", status: "Interview Scheduled", sc: "rgba(139,92,246,0.15)", tc: "#a78bfa" },
    { co: "Vercel", pos: "Full Stack Developer", status: "Applied", sc: "rgba(59,130,246,0.15)", tc: "#60a5fa" },
    { co: "Linear", pos: "Frontend Engineer", status: "AI Draft Ready", sc: "rgba(34,197,94,0.15)", tc: "#4ade80" },
    { co: "Notion", pos: "Backend Engineer", status: "Researching", sc: "rgba(245,158,11,0.15)", tc: "#fbbf24" },
  ];

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.55, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--lp-bg2)",
        border: "1px solid var(--lp-bd)",
        boxShadow: "0 0 80px rgba(99,102,241,0.18), 0 0 40px rgba(59,130,246,0.1), var(--lp-shadow-lg)",
      }}
    >
      {/* Chrome bar */}
      <div className="flex items-center gap-2 px-5 py-3" style={{ background: "var(--lp-card2)", borderBottom: "1px solid var(--lp-bd)" }}>
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
        <div className="w-3 h-3 rounded-full bg-green-400/70" />
        <div className="ml-4 flex-1 max-w-xs h-6 rounded-lg flex items-center px-3 gap-2" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd3)" }}>
          <div className="w-2 h-2 rounded-full bg-green-400/60" />
          <span className="text-[10px]" style={{ color: "var(--lp-t4)" }}>app.newjobguru.com/dashboard</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[9px] px-2.5 py-1 rounded-full" style={{ background: "rgba(99,102,241,0.12)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.2)" }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          AI Active
        </div>
      </div>

      <div className="flex min-h-[300px]">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col w-36 p-3 gap-0.5 shrink-0" style={{ background: "var(--lp-card3)", borderRight: "1px solid var(--lp-bd3)" }}>
          <div className="px-2.5 py-1 mb-2">
            <div className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--lp-t5)" }}>Navigation</div>
          </div>
          {["Dashboard", "My Jobs", "Applications", "Documents", "Insights"].map((item, i) => (
            <div
              key={item}
              className="text-[11px] px-2.5 py-2 rounded-lg cursor-default flex items-center gap-2"
              style={i === 0 ? { background: "rgba(59,130,246,0.15)", color: "#60a5fa", fontWeight: 600 } : { color: "var(--lp-t4)" }}
            >
              {i === 0 && <div className="w-1 h-3 rounded-full bg-blue-500" />}
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 space-y-3 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px]" style={{ color: "var(--lp-t4)" }}>Good morning, Alex 👋</div>
              <div className="text-sm font-bold" style={{ color: "var(--lp-t1)" }}>Job Search Dashboard</div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              AI Active
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-2">
            {statCards.map(({ label, value, change, c }) => (
              <div key={label} className="rounded-xl p-2.5" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}>
                <div className="text-[9px] mb-0.5" style={{ color: "var(--lp-t4)" }}>{label}</div>
                <div className="text-xl font-bold tabular-nums" style={{ color: "var(--lp-t1)" }}>{value}</div>
                <div className="text-[9px] font-medium" style={{ color: c }}>{change}</div>
              </div>
            ))}
          </div>

          {/* Job table */}
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--lp-bd3)" }}>
              <span className="text-[10px] font-semibold" style={{ color: "var(--lp-t3)" }}>Recent Applications</span>
              <span className="text-[9px] text-blue-500 cursor-default">View all →</span>
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

          {/* AI widgets */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 text-blue-500">AI Cover Letter</div>
              <div className="text-[10px] mb-2" style={{ color: "var(--lp-t3)" }}>Personalizing for Stripe role…</div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} initial={{ width: "0%" }} animate={{ width: "78%" }} transition={{ delay: 1.2, duration: 1.8 }} />
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 text-green-500">Gmail Intake</div>
              <div className="text-[10px] mb-2" style={{ color: "var(--lp-t3)" }}>4 new opportunities today</div>
              <div className="flex flex-wrap gap-1">
                {["Google", "Airbnb", "Figma"].map((co) => (
                  <span key={co} className="text-[8px] px-1.5 py-0.5 rounded-full text-green-600" style={{ background: "rgba(34,197,94,0.12)" }}>{co}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20 pb-16 lg:pb-24">
      <AuroraBackground />
      <Particles />
      <BeamEffect />
      <CursorGlow />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Two-column grid ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-14 xl:gap-20">

          {/* ══ LEFT — text ══ */}
          <div className="flex-1 min-w-0 lg:max-w-[50%] text-left pt-6 lg:pt-0">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 cursor-default"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a5b4fc" }}>
                AI-Powered Job Application Automation
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-[2.4rem] leading-[1.08] sm:text-5xl lg:text-[56px] xl:text-[64px] font-bold lg:leading-[1.06] tracking-tight mb-5">
              <motion.span
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{ color: "var(--lp-t1)" }}
              >
                Your AI-Powered
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.18, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{ color: "var(--lp-t1)" }}
              >
                Job Search
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.26, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{
                  background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #c084fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Command Center
              </motion.span>
            </h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.36 }}
              className="text-base sm:text-lg max-w-lg mb-8 leading-relaxed"
              style={{ color: "var(--lp-t3)" }}
            >
              Track applications, organize interviews, generate AI-powered cover letters, automate follow-ups, and manage your entire job pipeline from one intelligent workspace.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.44 }}
              className="flex flex-col sm:flex-row items-start gap-3 mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link
                  href="/login"
                  className="group relative overflow-hidden flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-white font-semibold text-base"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    boxShadow: "0 0 36px rgba(99,102,241,0.4), 0 4px 16px rgba(0,0,0,0.2)",
                    transition: "box-shadow 0.25s ease",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 52px rgba(99,102,241,0.65), 0 8px 24px rgba(0,0,0,0.28)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 36px rgba(99,102,241,0.4), 0 4px 16px rgba(0,0,0,0.2)")}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.2) 50%, transparent 65%)" }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4.5 }}
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <span className="relative z-10">Start Free</span>
                  <ArrowRight size={15} className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-200" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link
                  href="#how-it-works"
                  className="group relative overflow-hidden flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base"
                  style={{ color: "var(--lp-t2)", border: "1px solid var(--lp-bd2)", background: "var(--lp-card)", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(139,92,246,0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: "rgba(139,92,246,0.06)" }} />
                  {/* Play icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="relative z-10 opacity-70"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span className="relative z-10">View Demo</span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.54 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              {[
                { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "10K+", sub: "Applications Tracked", color: "#818cf8" },
                { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2", label: "95%", sub: "Automation Success", color: "#4ade80" },
                { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "4x", sub: "Faster Job Workflow", color: "#f59e0b" },
              ].map(({ icon, label, sub, color }) => (
                <div key={sub} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-none" style={{ color: "var(--lp-t1)" }}>{label}</div>
                    <div className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--lp-t4)" }}>{sub}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ══ RIGHT — dashboard ══ */}
          <div className="flex-1 min-w-0 lg:max-w-[52%] relative mt-12 lg:mt-0">
            {/* Glow */}
            <div
              className="absolute -inset-6 -z-10 blur-3xl opacity-25"
              style={{ background: "radial-gradient(ellipse at 55% 50%, rgba(99,102,241,0.32) 0%, rgba(251,191,36,0.12) 55%, transparent 80%)" }}
            />

            {/* Mobile preview */}
            <div className="block lg:hidden">
              <MobileAppPreview />
            </div>

            {/* Desktop dashboard — lanyard drop */}
            <div className="hidden lg:block relative" style={{ paddingTop: "7rem" }}>

              {/* Full lanyard assembly — strap + O-ring + swivel clip */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center" style={{ top: "-140px" }}>

                {/* Wide fabric strap */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.05, duration: 0.4, ease: "easeIn" }}
                  style={{ transformOrigin: "top", width: "14px", height: "110px", background: "linear-gradient(180deg, #111 0%, #1c1c1e 40%, #2a2a2e 100%)", borderRadius: "2px", boxShadow: "inset -2px 0 4px rgba(0,0,0,0.6), inset 2px 0 3px rgba(255,255,255,0.04), 2px 0 6px rgba(0,0,0,0.4)" }}
                />

                {/* Full badge clip SVG — O-ring + swivel clip body + jaw */}
                <svg width="44" height="80" viewBox="0 0 44 80" fill="none" style={{ marginTop: "-2px", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))" }}>
                  <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#9ca3af"/>
                      <stop offset="40%" stopColor="#6b7280"/>
                      <stop offset="100%" stopColor="#374151"/>
                    </linearGradient>
                    <linearGradient id="clipBodyGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6b7280"/>
                      <stop offset="50%" stopColor="#4b5563"/>
                      <stop offset="100%" stopColor="#374151"/>
                    </linearGradient>
                    <linearGradient id="clipShine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.12)"/>
                      <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                    </linearGradient>
                  </defs>

                  {/* O-ring */}
                  <ellipse cx="22" cy="14" rx="10" ry="11" stroke="url(#ringGrad)" strokeWidth="4" fill="none"/>
                  {/* O-ring inner highlight */}
                  <ellipse cx="22" cy="14" rx="10" ry="11" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none"/>

                  {/* Swivel neck connecting ring to clip body */}
                  <rect x="18" y="23" width="8" height="7" rx="2" fill="#4b5563"/>
                  <rect x="19" y="23" width="3" height="7" rx="1" fill="rgba(255,255,255,0.07)"/>

                  {/* Clip body — rounded rectangle */}
                  <rect x="10" y="29" width="24" height="34" rx="5" fill="url(#clipBodyGrad)" stroke="#374151" strokeWidth="1"/>
                  {/* Clip body shine */}
                  <rect x="11" y="30" width="22" height="32" rx="4" fill="url(#clipShine)"/>
                  {/* Left edge highlight */}
                  <rect x="11" y="30" width="3" height="32" rx="2" fill="rgba(255,255,255,0.08)"/>
                  {/* Centre slot on clip body */}
                  <rect x="17" y="38" width="10" height="18" rx="3" fill="#1f2937" stroke="#374151" strokeWidth="0.75"/>

                  {/* Curved jaw / hook at bottom */}
                  <path d="M22 63 C22 63 22 68 16 72 C12 74.5 9 73 8 70" stroke="url(#ringGrad)" strokeWidth="4" strokeLinecap="round" fill="none"/>
                  {/* Jaw tip */}
                  <circle cx="8" cy="70" r="2.5" fill="#6b7280"/>
                  {/* Jaw inner highlight */}
                  <path d="M22 63 C22 63 22 68 16 72" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>

              {/* Mockup with drop + pendulum swing */}
              <motion.div
                initial={{ y: -260, rotate: -10, opacity: 0 }}
                animate={{ y: 0, rotate: [null, 7, -5, 3, -1.5, 0.5, 0], opacity: 1 }}
                transition={{
                  y: { delay: 0.3, duration: 1.05, ease: [0.16, 1, 0.3, 1] },
                  rotate: { delay: 0.3, duration: 2.6, ease: "easeOut", times: [0, 0.3, 0.52, 0.68, 0.8, 0.92, 1] },
                  opacity: { delay: 0.25, duration: 0.2 },
                }}
                style={{ transformOrigin: "top center" }}
              >
                <DesktopMockup />
              </motion.div>

              {/* Floating card — top left */}
              <motion.div
                initial={{ opacity: 0, x: -16, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -top-6 -left-10 rounded-2xl p-3.5 w-44"
                style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "0 0 20px rgba(139,92,246,0.15), var(--lp-shadow)", backdropFilter: "blur(20px)" }}
              >
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>Interview booked!</span>
                  </div>
                  <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: "var(--lp-t3)" }}>Google SWE · Tomorrow 2:00 PM</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[9px] text-green-500">Added to calendar</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating card — bottom right */}
              <motion.div
                initial={{ opacity: 0, x: 16, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-6 -right-8 rounded-2xl p-3.5 w-52"
                style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "0 0 20px rgba(245,158,11,0.12), var(--lp-shadow)", backdropFilter: "blur(20px)" }}
              >
                <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>Cover letter done</span>
                  </div>
                  <p className="text-[10px] leading-relaxed mb-2" style={{ color: "var(--lp-t3)" }}>Personalized for Stripe — sounds just like you.</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)" }} initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ delay: 1.5, duration: 1.5 }} />
                    </div>
                    <span className="text-[9px] text-amber-500 shrink-0">94%</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Live stat pill — below mockup */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2 rounded-2xl px-5 py-3 flex items-center gap-3 whitespace-nowrap"
                style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "0 0 20px rgba(34,197,94,0.08), var(--lp-shadow)", backdropFilter: "blur(20px)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 shrink-0"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>47 applications sent this week</span>
                <span className="text-[10px] font-semibold text-green-500">↑ 23%</span>
                <div className="w-px h-4" style={{ background: "var(--lp-bd)" }} />
                <span className="text-[10px]" style={{ color: "var(--lp-t4)" }}>running while you sleep</span>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

