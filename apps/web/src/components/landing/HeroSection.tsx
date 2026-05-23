"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Brain, Mail, Star } from "lucide-react";
import { useLandingTheme } from "./LandingThemeContext";

// ── Warm aurora background ────────────────────────────────────────────────────

function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle dot grid — lighter, more refined */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, var(--lp-grid) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          opacity: "var(--lp-grid-o)",
        }}
      />

      {/* Warm amber orb — top left */}
      <motion.div
        className="absolute rounded-full blur-[140px]"
        style={{
          width: 650, height: 650,
          top: "-15%", left: "-12%",
          background: "radial-gradient(circle, rgba(251,191,36,0.13) 0%, rgba(245,158,11,0.07) 50%, transparent 70%)",
        }}
        animate={{ x: [0, 35, -15, 0], y: [0, -25, 30, 0], scale: [1, 1.06, 0.97, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blue/indigo orb — top right */}
      <motion.div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: 580, height: 580,
          top: "-5%", right: "-10%",
          background: "radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)",
        }}
        animate={{ x: [0, -40, 18, 0], y: [0, 35, -25, 0], scale: [1, 0.94, 1.08, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Rose/pink orb — bottom center */}
      <motion.div
        className="absolute rounded-full blur-[100px]"
        style={{
          width: 480, height: 480,
          bottom: "5%", left: "35%",
          background: "radial-gradient(circle, rgba(244,63,94,0.08) 0%, rgba(236,72,153,0.05) 50%, transparent 70%)",
        }}
        animate={{ x: [0, 25, -35, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 8 }}
      />

      {/* Center soft glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px]"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.09) 0%, rgba(251,191,36,0.04) 50%, transparent 70%)" }}
      />
    </div>
  );
}

// ── Soft floating particles ───────────────────────────────────────────────────

function Particles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 16 + 12,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.3 + 0.08,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(({ id, x, y, size, duration, delay, opacity }) => (
        <motion.div
          key={id}
          className="absolute rounded-full"
          style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: "var(--lp-particle)", opacity }}
          animate={{ y: [0, -22, 10, -15, 0], x: [0, 10, -8, 6, 0] }}
          transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Subtle beam ───────────────────────────────────────────────────────────────

function BeamEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute h-px w-[220px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.4), rgba(99,102,241,0.5), transparent)", top: "40%" }}
        animate={{ x: ["-40vw", "140vw"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear", repeatDelay: 7 }}
      />
    </div>
  );
}

// ── Cursor glow ───────────────────────────────────────────────────────────────

function CursorGlow() {
  const { isDark } = useLandingTheme();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 50, damping: 22 });
  const y = useSpring(my, { stiffness: 50, damping: 22 });
  useEffect(() => {
    const move = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);
  return (
    <motion.div
      className="fixed pointer-events-none z-0 hidden md:block"
      style={{
        x, y, width: 500, height: 500,
        translateX: "-50%", translateY: "-50%",
        background: isDark
          ? "radial-gradient(circle, rgba(251,191,36,0.04) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)"
          : "radial-gradient(circle, rgba(251,191,36,0.03) 0%, rgba(99,102,241,0.03) 40%, transparent 70%)",
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
    { co: "Linear", pos: "Frontend Engineer", status: "Cover letter ready", sc: "rgba(34,197,94,0.15)", tc: "#4ade80" },
  ];

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="w-full rounded-2xl overflow-hidden"
      style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd)", boxShadow: "0 0 60px rgba(99,102,241,0.12), var(--lp-shadow-lg)" }}
    >
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
          Active
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Tracking", value: "24", c: "#60a5fa" },
            { label: "Applied", value: "8", c: "#4ade80" },
            { label: "Interviews", value: "3", c: "#a78bfa" },
            { label: "Drafts", value: "12", c: "#f59e0b" },
          ].map(({ label, value, c }) => (
            <div key={label} className="rounded-xl p-2 text-center" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}>
              <div className="text-base font-bold tabular-nums" style={{ color: c }}>{value}</div>
              <div className="text-[9px] mt-0.5" style={{ color: "var(--lp-t4)" }}>{label}</div>
            </div>
          ))}
        </div>

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

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <Brain size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-semibold text-amber-500">Cover Letter</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--lp-t3)" }}>Stripe · writing…</div>
              <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)" }} initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ delay: 1.2, duration: 1.5 }} />
              </div>
            </div>
          </div>
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <Mail size={14} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-semibold text-green-500">Gmail</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--lp-t3)" }}>4 new jobs found</div>
              <div className="mt-1.5 flex gap-1">
                {["Google", "Meta"].map((co) => (
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
    { label: "Tracking", value: "24", change: "+3 this week", c: "#60a5fa" },
    { label: "Applied", value: "8", change: "+2 this week", c: "#4ade80" },
    { label: "Interviews", value: "3", change: "+1 today", c: "#a78bfa" },
    { label: "Drafts ready", value: "12", change: "+5 this week", c: "#f59e0b" },
  ];
  const jobRows = [
    { co: "Stripe", pos: "Senior Software Engineer", status: "Interview scheduled", sc: "rgba(139,92,246,0.15)", tc: "#a78bfa" },
    { co: "Vercel", pos: "Full Stack Developer", status: "Applied", sc: "rgba(59,130,246,0.15)", tc: "#60a5fa" },
    { co: "Linear", pos: "Frontend Engineer", status: "Cover letter ready", sc: "rgba(245,158,11,0.15)", tc: "#f59e0b" },
    { co: "Notion", pos: "Backend Engineer", status: "Researching", sc: "rgba(34,197,94,0.12)", tc: "#4ade80" },
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
        boxShadow: "0 0 70px rgba(99,102,241,0.12), 0 0 30px rgba(251,191,36,0.06), var(--lp-shadow-lg)",
      }}
    >
      {/* Chrome */}
      <div className="flex items-center gap-2 px-5 py-3" style={{ background: "var(--lp-card2)", borderBottom: "1px solid var(--lp-bd)" }}>
        <div className="w-3 h-3 rounded-full bg-red-400/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
        <div className="w-3 h-3 rounded-full bg-green-400/70" />
        <div className="ml-4 flex-1 max-w-xs h-6 rounded-lg flex items-center px-3 gap-2" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd3)" }}>
          <div className="w-2 h-2 rounded-full bg-green-400/60" />
          <span className="text-[10px]" style={{ color: "var(--lp-t4)" }}>app.newjobguru.com/dashboard</span>
        </div>
      </div>

      <div className="flex min-h-[300px]">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col w-36 p-3 gap-0.5 shrink-0" style={{ background: "var(--lp-card3)", borderRight: "1px solid var(--lp-bd3)" }}>
          <div className="px-2.5 py-1 mb-1">
            <div className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--lp-t5)" }}>NAVIGATION</div>
          </div>
          {["Dashboard", "My Jobs", "Applications", "Documents", "Insights"].map((item, i) => (
            <div key={item} className="text-[11px] px-2.5 py-2 rounded-lg cursor-default" style={i === 0 ? { background: "rgba(59,130,246,0.15)", color: "#60a5fa", fontWeight: 600 } : { color: "var(--lp-t4)" }}>
              {item}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-4 space-y-3 min-w-0">
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

          <div className="grid grid-cols-4 gap-2">
            {statCards.map(({ label, value, change, c }) => (
              <div key={label} className="rounded-xl p-2.5" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)" }}>
                <div className="text-[9px] mb-0.5" style={{ color: "var(--lp-t4)" }}>{label}</div>
                <div className="text-xl font-bold tabular-nums" style={{ color: "var(--lp-t1)" }}>{value}</div>
                <div className="text-[9px] font-medium" style={{ color: c }}>{change}</div>
              </div>
            ))}
          </div>

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

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 text-amber-500">Writing cover letter</div>
              <div className="text-[10px] mb-2" style={{ color: "var(--lp-t3)" }}>Personalizing for Stripe…</div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)" }} initial={{ width: "0%" }} animate={{ width: "72%" }} transition={{ delay: 1.2, duration: 1.8 }} />
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 text-green-500">Gmail — 4 new jobs</div>
              <div className="text-[10px] mb-2" style={{ color: "var(--lp-t3)" }}>Imported automatically</div>
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
    <section className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20">
      <AuroraBackground />
      <Particles />
      <BeamEffect />
      <CursorGlow />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Human badge — social proof, not AI jargon */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 sm:mb-10 cursor-default"
          style={{
            background: "var(--lp-card2)",
            border: "1px solid var(--lp-bd2)",
          }}
        >
          {/* Mini star row */}
          <div className="flex gap-0.5">
            {[0,1,2,3,4].map(i => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
          </div>
          <span className="text-xs sm:text-sm font-medium" style={{ color: "var(--lp-t2)" }}>
            Loved by <span className="font-semibold" style={{ color: "var(--lp-t1)" }}>10,000+</span> job seekers in 40+ countries
          </span>
        </motion.div>

        {/* Headline — honest, human, relatable */}
        <h1 className="text-[2.1rem] leading-[1.12] sm:text-5xl lg:text-[66px] font-bold lg:leading-[1.1] tracking-tight mb-5 sm:mb-6">
          <motion.span
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.12, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="block"
            style={{ color: "var(--lp-t1)" }}
          >
            Stop losing track of
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.22, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="block"
            style={{ color: "var(--lp-t1)" }}
          >
            your applications.
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.32, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="block mt-1 text-[1.75rem] sm:text-4xl lg:text-5xl font-semibold"
            style={{ color: "var(--lp-t3)" }}
          >
            Finally land <RotatingOutcome />
          </motion.span>
        </h1>

        {/* Subtext — honest and specific */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.44 }}
          className="text-sm sm:text-lg lg:text-xl max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2 sm:px-0"
          style={{ color: "var(--lp-t3)" }}
        >
          NewJob Guru tracks every application, writes personalized cover letters, and follows up automatically — so you can spend less time on admin and more time actually getting hired.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.52 }}
          className="hidden sm:flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="group relative overflow-hidden flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-base"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                boxShadow: "0 0 40px rgba(99,102,241,0.3), 0 4px 20px rgba(0,0,0,0.2)",
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
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all"
              style={{ color: "var(--lp-t2)", border: "1px solid var(--lp-bd2)", background: "var(--lp-card)" }}
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust checkmarks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.62 }}
          className="hidden sm:flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 sm:mb-14"
        >
          {[
            "No credit card required",
            "Setup in under 5 minutes",
            "Cancel anytime, no questions",
          ].map((point) => (
            <div key={point} className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-green-500 shrink-0" />
              <span className="text-sm" style={{ color: "var(--lp-t4)" }}>{point}</span>
            </div>
          ))}
        </motion.div>

        {/* Mockup */}
        <div className="relative w-full max-w-5xl mx-auto">
          <div
            className="absolute -inset-4 -z-10 blur-3xl opacity-25"
            style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.25) 0%, rgba(251,191,36,0.1) 50%, transparent 70%)" }}
          />

          {/* Mobile */}
          <div className="block md:hidden">
            <MobileAppPreview />
          </div>

          {/* Desktop */}
          <div className="hidden md:block relative">
            <DesktopMockup />

            {/* Floating card — left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="absolute -left-2 lg:-left-14 top-1/4 rounded-2xl p-4 w-48 hidden lg:block"
              style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "0 0 24px rgba(139,92,246,0.12), var(--lp-shadow)", backdropFilter: "blur(20px)" }}
            >
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">🎉</div>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>Interview booked!</span>
                </div>
                <p className="text-[10px] leading-relaxed mb-2" style={{ color: "var(--lp-t3)" }}>Google SWE · Tomorrow 2:00 PM</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[9px] text-green-500">Added to calendar</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating card — right */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="absolute -right-2 lg:-right-14 top-1/3 rounded-2xl p-4 w-52 hidden lg:block"
              style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "0 0 24px rgba(245,158,11,0.1), var(--lp-shadow)", backdropFilter: "blur(20px)" }}
            >
              <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">✍️</div>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>Cover letter done</span>
                </div>
                <p className="text-[10px] leading-relaxed mb-2" style={{ color: "var(--lp-t3)" }}>Personalized for Stripe Engineering — sounds just like you.</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)" }} initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ delay: 1.5, duration: 1.5 }} />
                  </div>
                  <span className="text-[9px] text-amber-500 shrink-0">94% match</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Bottom stat pill */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-2xl px-5 py-3 hidden lg:flex items-center gap-4"
              style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd2)", boxShadow: "0 0 24px rgba(34,197,94,0.08), var(--lp-shadow)", backdropFilter: "blur(20px)" }}
            >
              <div className="text-base">🚀</div>
              <span className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>47 applications sent this week</span>
              <span className="text-[10px] font-semibold text-green-500">↑ 23%</span>
              <div className="w-px h-4" style={{ background: "var(--lp-bd)" }} />
              <span className="text-[10px]" style={{ color: "var(--lp-t4)" }}>running while you sleep</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
