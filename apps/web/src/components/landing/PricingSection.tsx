"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Perfect for getting started with AI-powered job tracking.",
    badge: null,
    features: [
      "Up to 25 active job applications",
      "Gmail integration (1 account)",
      "Basic AI cover letters (5/month)",
      "Job pipeline & kanban board",
      "Manual follow-up reminders",
      "Basic analytics dashboard",
      "Email support",
    ],
    notIncluded: [
      "Unlimited AI cover letters",
      "Auto-follow-up automation",
      "Google Drive CV routing",
      "Interview prep AI",
      "Multi-language support",
      "Priority support",
    ],
    cta: "Get Started Free",
    ctaStyle: "border border-white/20 text-white hover:bg-white/5",
    recommended: false,
    color: "border-white/[0.08]",
    headerBg: "",
  },
  {
    name: "Professional",
    monthlyPrice: 29,
    annualPrice: 19,
    description: "The full AI automation stack for serious job seekers.",
    badge: "Most Popular",
    features: [
      "Unlimited job applications",
      "Gmail integration (3 accounts)",
      "Unlimited AI cover letters",
      "Automated follow-up system",
      "Google Drive CV routing",
      "Interview scheduling + prep AI",
      "Multi-language support (15 languages)",
      "Advanced analytics & reports",
      "AI research assistant",
      "Priority email & chat support",
      "Weekly AI-powered digest",
      "Application export (PDF, CSV)",
    ],
    notIncluded: [],
    cta: "Start Free Trial",
    ctaStyle: "text-white font-semibold shadow-lg hover:opacity-90 hover:scale-105",
    recommended: true,
    color: "border-blue-500/40",
    headerBg: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))",
  },
  {
    name: "Enterprise",
    monthlyPrice: 79,
    annualPrice: 59,
    description: "For power users applying at scale across multiple markets.",
    badge: null,
    features: [
      "Everything in Professional",
      "Unlimited Gmail accounts",
      "Custom AI model fine-tuning",
      "Dedicated account manager",
      "Custom integrations & webhooks",
      "SSO & team collaboration",
      "API access",
      "White-label reports",
      "SLA guarantee (99.9% uptime)",
      "Phone & Slack support",
      "Custom onboarding",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    ctaStyle: "border border-white/20 text-white hover:bg-white/5",
    recommended: false,
    color: "border-white/[0.08]",
    headerBg: "",
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 mb-5">
            <Sparkles size={12} className="text-green-400" />
            <span className="text-sm text-green-300 font-medium">Simple, transparent pricing</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Start free.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #4ade80, #60a5fa)" }}
            >
              Scale when ready.
            </span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
            No hidden fees. No credit card to start. Cancel or downgrade anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full border border-white/10 bg-white/[0.04]">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}
            >
              Annual
              <span className="inline-flex px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30">
                Save 35%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map(({ name, monthlyPrice, annualPrice, description, badge, features, notIncluded, cta, ctaStyle, recommended, color, headerBg }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl border ${color} flex flex-col overflow-hidden ${recommended ? "md:-mt-4 md:mb-4" : ""}`}
              style={{ background: recommended ? headerBg : "rgba(255,255,255,0.02)" }}
            >
              {/* Recommended glow */}
              {recommended && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{ boxShadow: "0 0 60px rgba(59,130,246,0.2), inset 0 0 60px rgba(99,102,241,0.05)" }}
                />
              )}

              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 border-b border-white/[0.06]" style={{ background: headerBg || undefined }}>
                {badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-[11px] font-semibold" style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white" }}>
                    <Zap size={10} fill="white" />
                    {badge}
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                <p className="text-sm text-slate-400 mb-4">{description}</p>

                <div className="flex items-end gap-1">
                  <span
                    className="text-5xl font-black bg-clip-text text-transparent"
                    style={{
                      backgroundImage: recommended
                        ? "linear-gradient(135deg, #60a5fa, #a78bfa)"
                        : "linear-gradient(135deg, #f8fafc, #94a3b8)",
                    }}
                  >
                    ${annual ? annualPrice : monthlyPrice}
                  </span>
                  <span className="text-slate-500 text-sm mb-2">/month</span>
                </div>
                {annual && annualPrice > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">billed ${annualPrice * 12}/year · save ${(monthlyPrice - annualPrice) * 12}/yr</p>
                )}
                {monthlyPrice === 0 && <p className="text-[11px] text-slate-500 mt-1">free forever · no credit card</p>}
              </div>

              {/* CTA */}
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <Link
                  href="/login"
                  className={`block w-full text-center py-3 rounded-xl text-sm transition-all ${ctaStyle} ${recommended ? "" : ""}`}
                  style={
                    recommended
                      ? { background: "linear-gradient(135deg, #2563eb, #7c3aed)", boxShadow: "0 0 30px rgba(99,102,241,0.3)" }
                      : undefined
                  }
                >
                  {cta}
                </Link>
              </div>

              {/* Features */}
              <div className="px-6 py-5 flex-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">What&apos;s included</p>
                <ul className="space-y-2.5">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check size={13} className={`mt-0.5 shrink-0 ${recommended ? "text-blue-400" : "text-green-400"}`} />
                      <span className="text-[12px] text-slate-300 leading-snug">{feature}</span>
                    </li>
                  ))}
                  {notIncluded.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 opacity-30">
                      <div className="w-[13px] h-[13px] mt-0.5 shrink-0 flex items-center justify-center">
                        <div className="w-3 h-px bg-slate-600" />
                      </div>
                      <span className="text-[12px] text-slate-500 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-slate-600 mt-8"
        >
          All plans include a 14-day free trial of Professional features. No credit card required to start.
        </motion.p>
      </div>
    </section>
  );
}
