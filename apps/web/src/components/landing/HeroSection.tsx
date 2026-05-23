"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Brain, Mail } from "lucide-react";
import { useLandingTheme } from "./LandingThemeContext";

// ── Aurora background ─────────────────────────────────────────────────────────

function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Fine grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(var(--lp-grid) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          opacity: "var(--lp-grid-o)",
        }}
      />

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
            <Brain size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-semibold text-blue-500">AI Cover Letter</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--lp-t3)" }}>Stripe · 94% match</div>
              <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ delay: 1.2, duration: 1.5 }} />
              </div>
            </div>
          </div>
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <Mail size={14} className="text-green-500 shrink-0 mt-0.5" />
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
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-7 cursor-default"
              style={{ background: "var(--lp-card2)", border: "1px solid var(--lp-bd2)" }}
            >
              <div className="flex gap-0.5">
                {[0,1,2,3,4].map(i => (
                  <svg key={i} className="w-2.5 h-2.5 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium" style={{ color: "var(--lp-t2)" }}>
                Loved by <span className="font-bold" style={{ color: "var(--lp-t1)" }}>10,000+</span> job seekers in 40+ countries
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-[2.2rem] leading-[1.1] sm:text-5xl lg:text-[56px] xl:text-[62px] font-bold lg:leading-[1.08] tracking-tight mb-5">
              <motion.span
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{ color: "var(--lp-t1)" }}
              >
                Stop losing track
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.18, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{ color: "var(--lp-t1)" }}
              >
                of your applications.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.26, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="block mt-2 text-[1.65rem] sm:text-4xl lg:text-[38px] xl:text-[44px] font-semibold"
                style={{ color: "var(--lp-t3)" }}
              >
                Finally land <RotatingOutcome />
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
              NewJob Guru tracks every application, writes personalized cover letters, and follows up automatically — so you spend less time on admin and more time getting hired.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.44 }}
              className="flex flex-col sm:flex-row items-start gap-3 mb-7"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="group relative overflow-hidden flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-white font-semibold text-base"
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                    boxShadow: "0 0 36px rgba(99,102,241,0.35), 0 4px 16px rgba(0,0,0,0.18)",
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)" }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4.5 }}
                  />
                  <span className="relative z-10">Get started free</span>
                  <ArrowRight size={15} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-base"
                  style={{ color: "var(--lp-t2)", border: "1px solid var(--lp-bd2)", background: "var(--lp-card)" }}
                >
                  See how it works
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.54 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              {["No credit card required", "Setup in 5 minutes", "Cancel anytime"].map((point) => (
                <div key={point} className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                  <span className="text-sm" style={{ color: "var(--lp-t4)" }}>{point}</span>
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

            {/* Desktop dashboard */}
            <div className="hidden lg:block relative">
              <DesktopMockup />

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
                    <span className="text-base">🎉</span>
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
                    <span className="text-base">✍️</span>
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
                <span>🚀</span>
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

