"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background — deep dark with subtle purple glow */}
      <div className="absolute inset-0 bg-[#0a0614]" />

      {/* Subtle radial glow center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)",
        }}
      />

      {/* Very faint grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content — centered */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-10 text-center py-32">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
            AI-Powered Job Application Automation
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 text-white leading-[1.08]"
        >
          Your AI-Powered
          <br />
          Job Search{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Command Center
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.65 }}
          className="text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Track applications, generate AI cover letters, automate follow-ups, and manage your entire job pipeline — all in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Link
              href="/login"
              className="group relative overflow-hidden inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-base"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                boxShadow: "0 0 40px rgba(99,102,241,0.4), 0 4px 16px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 60px rgba(99,102,241,0.65), 0 8px 24px rgba(0,0,0,0.35)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 40px rgba(99,102,241,0.4), 0 4px 16px rgba(0,0,0,0.3)")}
            >
              <motion.div
                className="absolute inset-0"
                style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 5 }}
              />
              <span className="relative z-10">Start Free</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Link
              href="#how-it-works"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200"
              style={{
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)";
                e.currentTarget.style.background = "rgba(139,92,246,0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-70"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              View Demo
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.48 }}
          className="flex flex-wrap items-center justify-center gap-8"
        >
          {[
            { value: "10K+", label: "Applications Tracked" },
            { value: "95%", label: "Automation Success" },
            { value: "4x", label: "Faster Job Workflow" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Bottom fade into page */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, var(--lp-bg))" }}
      />

    </section>
  );
}
