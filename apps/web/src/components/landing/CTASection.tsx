"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 border-t border-white/[0.05] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)`,
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 mb-8">
            <Sparkles size={12} className="text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Join 10,000+ job seekers</span>
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Start automating your
            <span
              className="block bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #22d3ee 100%)" }}
            >
              job search today
            </span>
          </h2>

          <p className="text-slate-400 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop spending hours on spreadsheets and manual tracking. Let AI handle the busywork so you can focus on what matters — landing the interview.
          </p>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10">
            {[
              "Free to start — no credit card",
              "Setup in under 5 minutes",
              "Cancel anytime",
            ].map((point) => (
              <div key={point} className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                <span className="text-sm">{point}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group flex items-center gap-2 px-10 py-4 rounded-full text-white font-semibold text-lg transition-all hover:scale-105 active:scale-100 w-full sm:w-auto justify-center"
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                boxShadow: "0 0 60px rgba(99,102,241,0.35), 0 8px 30px rgba(0,0,0,0.5)",
              }}
            >
              Start Free Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-10 py-4 rounded-full border border-white/20 text-white font-semibold text-lg hover:bg-white/5 hover:border-white/40 transition-all w-full sm:w-auto justify-center"
            >
              Login to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
