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
    features: ["Up to 25 active job applications", "Gmail via Unipile (1 account)", "Basic AI cover letters (5/month)", "Job pipeline & kanban board", "Manual follow-up reminders", "Basic analytics dashboard", "Email support"],
    missing: ["Unlimited AI cover letters", "Priority follow-up reminders", "Multi-document templates", "Interview prep AI", "Multi-language support", "Priority support"],
    cta: "Get Started Free",
    recommended: false,
  },
  {
    name: "Professional",
    monthlyPrice: 29,
    annualPrice: 19,
    description: "The full AI automation stack for serious job seekers.",
    badge: "Most Popular",
    features: ["Unlimited job applications", "Gmail via Unipile", "Unlimited AI cover letters", "Apply Assistant on mobile", "Secure document storage", "Interview tracking + prep notes", "Multi-language support (15 languages)", "Advanced analytics & reports", "AI research assistant", "Priority email & chat support", "Weekly AI-powered digest", "Application export (PDF, CSV)"],
    missing: [],
    cta: "Start Free Trial",
    recommended: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: 79,
    annualPrice: 59,
    description: "For power users applying at scale across multiple markets.",
    badge: null,
    features: ["Everything in Professional", "Team collaboration", "Custom AI model fine-tuning", "Dedicated account manager", "Custom integrations & webhooks", "SSO", "API access", "White-label reports", "SLA guarantee (99.9% uptime)", "Phone & Slack support", "Custom onboarding"],
    missing: [],
    cta: "Contact Sales",
    recommended: false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 mb-5">
            <Sparkles size={12} className="text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Simple, transparent pricing</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "var(--lp-t1)" }}>
            Start free.{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #4ade80, #60a5fa)" }}>
              Scale when ready.
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8" style={{ color: "var(--lp-t3)" }}>
            No hidden fees. No credit card to start. Cancel or downgrade anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full" style={{ border: "1px solid var(--lp-bd2)", background: "var(--lp-card2)" }}>
            <button
              onClick={() => setAnnual(false)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all"
              style={!annual ? { background: "var(--lp-t1)", color: "var(--lp-bg)" } : { color: "var(--lp-t3)" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2"
              style={annual ? { background: "var(--lp-t1)", color: "var(--lp-bg)" } : { color: "var(--lp-t3)" }}
            >
              Annual
              <span className="inline-flex px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold border border-green-500/30">
                Save 35%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards — Professional shown first on mobile via order */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map(({ name, monthlyPrice, annualPrice, description, badge, features, missing, cta, recommended }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: recommended ? -8 : -4 }}
              className={`relative rounded-2xl flex flex-col overflow-hidden ${recommended ? "order-first md:order-none md:-mt-4 md:mb-4" : ""}`}
              style={{
                background: "var(--lp-card)",
                border: recommended ? "1px solid rgba(59,130,246,0.4)" : "1px solid var(--lp-bd)",
                boxShadow: recommended ? "0 0 60px rgba(59,130,246,0.15), var(--lp-shadow)" : "var(--lp-shadow-sm)",
              }}
            >
              {/* Recommended glow overlay */}
              {recommended && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.06))" }} />
              )}

              {/* Header */}
              <div className="relative px-6 pt-6 pb-5" style={{ borderBottom: "1px solid var(--lp-bd)" }}>
                {badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-[11px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                    <Zap size={10} fill="white" />
                    {badge}
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1" style={{ color: "var(--lp-t1)" }}>{name}</h3>
                <p className="text-sm mb-4" style={{ color: "var(--lp-t3)" }}>{description}</p>
                <div className="flex items-end gap-1">
                  <span
                    className="text-5xl font-black bg-clip-text text-transparent"
                    style={{ backgroundImage: recommended ? "linear-gradient(135deg, #60a5fa, #a78bfa)" : "linear-gradient(135deg, var(--lp-t1), var(--lp-t3))" }}
                  >
                    ${annual ? annualPrice : monthlyPrice}
                  </span>
                  <span className="text-sm mb-2" style={{ color: "var(--lp-t4)" }}>/month</span>
                </div>
                {annual && annualPrice > 0 && <p className="text-[11px] mt-1" style={{ color: "var(--lp-t5)" }}>billed ${annualPrice * 12}/year · save ${(monthlyPrice - annualPrice) * 12}/yr</p>}
                {monthlyPrice === 0 && <p className="text-[11px] mt-1" style={{ color: "var(--lp-t5)" }}>free forever · no credit card</p>}
              </div>

              {/* CTA */}
              <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--lp-bd)" }}>
                <Link
                  href="/login"
                  className="block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-100"
                  style={
                    recommended
                      ? { background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white", boxShadow: "0 0 30px rgba(99,102,241,0.25)" }
                      : { background: "var(--lp-card2)", color: "var(--lp-t2)", border: "1px solid var(--lp-bd2)" }
                  }
                >
                  {cta}
                </Link>
              </div>

              {/* Features */}
              <div className="px-6 py-5 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--lp-t5)" }}>What&apos;s included</p>
                <ul className="space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={13} className={`mt-0.5 shrink-0 ${recommended ? "text-blue-500" : "text-green-500"}`} />
                      <span className="text-[12px] leading-snug" style={{ color: "var(--lp-t2)" }}>{f}</span>
                    </li>
                  ))}
                  {missing.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 opacity-30">
                      <div className="w-[13px] h-[13px] mt-0.5 shrink-0 flex items-center justify-center">
                        <div className="w-3 h-px" style={{ background: "var(--lp-t5)" }} />
                      </div>
                      <span className="text-[12px] leading-snug" style={{ color: "var(--lp-t4)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center text-sm mt-8" style={{ color: "var(--lp-t5)" }}>
          All plans include a 14-day free trial of Professional features. No credit card required to start.
        </motion.p>
      </div>
    </section>
  );
}
