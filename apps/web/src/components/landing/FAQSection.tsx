"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  { q: "How does Gmail integration work?", a: "Connect your Gmail account via OAuth — no passwords stored, just a secure read/write permission. NewJob Guru monitors your inbox in real time. When our AI detects a job-related email (a job posting, recruiter message, interview invite, or application confirmation), it automatically imports it into your pipeline. You can configure filtering rules to only track specific senders, keywords, or job boards." },
  { q: "Is my data secure and private?", a: "Absolutely. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We follow GDPR and CCPA compliance standards. We never sell your data to third parties, and we never read your email content beyond detecting job-related signals. Your CV, cover letters, and application data are stored in isolated, tenant-scoped storage. You can export or delete all your data at any time." },
  { q: "Can I use my own CV and documents?", a: "Yes — you can upload multiple CV versions (e.g., a general CV, a technical CV, a senior management CV) and NewJob Guru will automatically route the most relevant one to each application based on the job requirements. You can also upload cover letter templates, portfolio links, certifications, and references. Everything connects to Google Drive so your documents stay in sync." },
  { q: "Does AI really generate cover letters automatically?", a: "Yes. Our AI cover letter engine is powered by advanced language models (Claude by Anthropic) and generates highly personalized, natural-sounding letters — not generic templates. It reads the job description, your CV, and your previous successful applications to tailor every letter. You can set a tone (formal, friendly, technical) and the AI adapts. You always review before sending — or enable fully automatic mode if you prefer." },
  { q: "Can I track interviews and schedule them automatically?", a: "Yes. NewJob Guru integrates with Google Calendar to automatically create interview events when scheduling emails are detected. You'll get AI-generated prep notes for each interview including likely questions, company research, and suggested talking points based on your CV and the job description. Reminder notifications are sent 24 hours and 1 hour before each interview." },
  { q: "Does it support multiple languages?", a: "Yes. NewJob Guru supports 15+ languages for cover letter generation, email templates, and the application interface. Currently supported languages include English, German, French, Spanish, Portuguese, Dutch, Italian, Swedish, Danish, Norwegian, Polish, Japanese, Chinese (Simplified), Korean, and Arabic. Multi-language applications are first-class citizens — apply to international roles without friction." },
  { q: "What job boards and platforms does it integrate with?", a: "NewJob Guru works primarily through Gmail monitoring, which means it captures applications from any job board or recruiter that sends you an email — LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, Workday, and hundreds more. We also have direct browser extension support for LinkedIn Easy Apply to auto-fill applications. No platform partnerships required." },
  { q: "Can I cancel or downgrade at any time?", a: "Absolutely. There are no lock-in contracts. You can cancel, downgrade, or upgrade your plan at any time from your account settings. If you cancel a paid plan, you retain access until the end of your billing period. Your data is yours — export everything at any time, and we'll retain it for 30 days after cancellation in case you change your mind." },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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

        {/* Accordion */}
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
