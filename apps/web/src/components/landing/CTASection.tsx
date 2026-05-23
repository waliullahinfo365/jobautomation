"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)" }} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(var(--lp-grid) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)" }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.20, 0.12, 0.20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 mb-8">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
              <Sparkles size={12} className="text-purple-500" />
            </motion.div>
            <span className="text-sm text-purple-500 font-medium">Join 10,000+ job seekers</span>
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: "var(--lp-t1)" }}>
            Start automating your
            <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #22d3ee 100%)" }}>
              job search today
            </span>
          </h2>

          <p className="text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--lp-t3)" }}>
            Stop spending hours on spreadsheets and manual tracking. Let AI handle the busywork so you can focus on what matters — landing the interview.
          </p>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10">
            {["Free to start — no credit card", "Setup in under 5 minutes", "Cancel anytime"].map((point) => (
              <div key={point} className="flex items-center gap-2" style={{ color: "var(--lp-t3)" }}>
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                <span className="text-sm">{point}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="group flex items-center gap-2 px-10 py-4 rounded-full text-white font-semibold text-lg w-full sm:w-auto justify-center"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  boxShadow: "0 0 60px rgba(99,102,241,0.30), 0 8px 30px rgba(0,0,0,0.2)",
                }}
              >
                Start Free Now
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="flex items-center gap-2 px-10 py-4 rounded-full font-semibold text-lg transition-all w-full sm:w-auto justify-center"
                style={{ color: "var(--lp-t2)", border: "1px solid var(--lp-bd2)", background: "var(--lp-card)" }}
              >
                Login to Dashboard
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
