"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "How does email integration work?",
    a: "Connect Gmail through Unipile’s secure hosted login — NewJob Guru never stores your Google password. Job-alert emails are imported into your Job Inbox so you can review roles and apply with Apply Assistant. Use Scan now anytime; realtime updates work once the Unipile webhook is registered.",
  },
  {
    q: "Does it auto-apply to LinkedIn for me?",
    a: "Beta focuses on assisted mobile apply: open the job link, share your CV/cover letter, use AI answers, and mark Applied in a few taps. Cloud LinkedIn auto-apply is not part of the beta path.",
  },
  {
    q: "Can I use my own CV and documents?",
    a: "Yes — upload your CV and cover letter templates in Documents. Files are stored securely (Firebase Storage) and available in Apply Assistant when an employer form asks for attachments.",
  },
  {
    q: "Does AI generate cover letters?",
    a: "Yes. AI generates personalized cover letters from the job description and your profile. You review before you apply — nothing is sent without you.",
  },
  {
    q: "What job boards does it work with?",
    a: "Any board that sends job alerts to your connected Gmail — Stepstone, Indeed, LinkedIn alerts, Arbeitsagentur, and more. Apply Assistant works on LinkedIn and employer career sites on your phone.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Documents and account data are stored for your workspace only. We don’t sell your data. You can disconnect email anytime in Settings.",
  },
  {
    q: "What is included in beta?",
    a: "Email job intake (Unipile), AI extraction, document upload, mobile Apply Assistant, application tracking, and billing if configured. Optional Google Calendar and team notifications may be available in Advanced settings.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no lock-in contracts. Cancel or change plans from Settings. Your data remains yours — export when you need it.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-5">
            <HelpCircle size={12} className="text-blue-500" />
            <span className="text-sm text-blue-500 font-medium">Common questions</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--lp-t1)" }}>Everything you need to know</h2>
          <p className="text-base" style={{ color: "var(--lp-t3)" }}>
            Can&apos;t find your answer?{" "}
            <a href="mailto:hello@newjobguru.com" className="text-blue-500 hover:text-blue-400 underline underline-offset-2">Email us</a>
            {" "}— we reply within 24 hours.
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <motion.div
              key={q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: openIndex === i ? "var(--lp-card)" : "var(--lp-card2)",
                border: openIndex === i ? "1px solid rgba(59,130,246,0.3)" : "1px solid var(--lp-bd)",
                boxShadow: openIndex === i ? "0 4px 20px rgba(59,130,246,0.06)" : "var(--lp-shadow-sm)",
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold leading-snug transition-colors" style={{ color: openIndex === i ? "#60a5fa" : "var(--lp-t1)" }}>
                  {q}
                </span>
                <motion.div animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
                  <ChevronDown size={18} style={{ color: openIndex === i ? "#60a5fa" : "var(--lp-t4)" }} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-6 pb-5">
                      <div className="h-px mb-4" style={{ background: "var(--lp-bd)" }} />
                      <p className="text-sm leading-relaxed" style={{ color: "var(--lp-t3)" }}>{a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
