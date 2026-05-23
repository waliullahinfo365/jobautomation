"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Briefcase, BarChart3, Sparkles, Calendar } from "lucide-react";

const TABS = [
  { id: "pipeline", label: "Job Pipeline", icon: Briefcase },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "ai", label: "AI Drafts", icon: Sparkles },
  { id: "interviews", label: "Interviews", icon: Calendar },
];

function PipelinePreview() {
  const stages = [
    { label: "New", count: 8, dot: "#94a3b8", jobs: ["Senior Dev · Google", "Backend Eng · Meta", "SWE · Stripe"] },
    { label: "Saved", count: 12, dot: "#60a5fa", jobs: ["Frontend · Vercel", "Full Stack · Linear", "React Dev · Notion"] },
    { label: "Applied", count: 5, dot: "#a78bfa", jobs: ["Platform Eng · Airbnb", "Senior SWE · Figma"] },
    { label: "Interview", count: 3, dot: "#4ade80", jobs: ["Staff Eng · Shopify"] },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
      {stages.map(({ label, count, dot, jobs }) => (
        <div key={label} className="rounded-xl overflow-hidden" style={{ background: "var(--lp-card2)", border: "1px solid var(--lp-bd)" }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--lp-bd3)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: dot }} />
              <span className="text-[10px] font-semibold" style={{ color: "var(--lp-t3)" }}>{label}</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: "var(--lp-t1)", background: "var(--lp-card)" }}>{count}</span>
          </div>
          <div className="p-2 space-y-1.5">
            {jobs.map((job) => (
              <div key={job} className="text-[9px] rounded-lg px-2 py-1.5 truncate cursor-default hover:translate-x-0.5 transition-transform" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd3)", color: "var(--lp-t3)" }}>
                {job}
              </div>
            ))}
            <div className="text-[9px] text-center py-1" style={{ color: "var(--lp-t5)" }}>+{count - jobs.length} more</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPreview() {
  const bars = [65, 82, 45, 91, 78, 55, 88, 72, 95, 60, 84, 70];
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Response Rate", value: "34%", change: "+12%", color: "#4ade80" },
          { label: "Interview Rate", value: "18%", change: "+7%", color: "#60a5fa" },
          { label: "Avg Reply Time", value: "4.2d", change: "-1.3d", color: "#a78bfa" },
        ].map(({ label, value, change, color }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: "var(--lp-card2)", border: "1px solid var(--lp-bd)" }}>
            <div className="text-[9px] mb-1" style={{ color: "var(--lp-t5)" }}>{label}</div>
            <div className="text-base font-bold" style={{ color: "var(--lp-t1)" }}>{value}</div>
            <div className="text-[9px]" style={{ color }}>{change}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-3" style={{ background: "var(--lp-card2)", border: "1px solid var(--lp-bd)" }}>
        <div className="text-[10px] font-semibold mb-3" style={{ color: "var(--lp-t3)" }}>Applications per Month</div>
        <div className="flex items-end gap-1 h-20">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.5 }}
                className="w-full rounded-t-sm"
                style={{ background: i === 4 ? "linear-gradient(180deg, #60a5fa, #3b82f6)" : "var(--lp-bd2)" }}
              />
              <span className="text-[7px]" style={{ color: "var(--lp-t5)" }}>{months[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIDraftPreview() {
  return (
    <div className="p-4 space-y-3">
      <div className="rounded-xl p-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">AI Cover Letter — Stripe</div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--lp-t4)" }}>Senior Software Engineer · San Francisco</div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full text-green-600 dark:text-green-400" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.20)" }}>94% match</span>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium" style={{ color: "var(--lp-t1)" }}>Dear Stripe Engineering Team,</p>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--lp-t3)" }}>I am excited to apply for the Senior Software Engineer role. With 6+ years building scalable payment infrastructure at high-growth startups, I bring exactly the expertise your team needs.</p>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--lp-t4)" }}>My experience with distributed systems, TypeScript, and API design aligns directly with Stripe's technical requirements…</p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: "var(--lp-bd)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }}
              initial={{ width: "0%" }}
              whileInView={{ width: "94%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[9px]" style={{ color: "var(--lp-t5)" }}>94% personalized</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { role: "Vercel · Frontend Lead", score: "87%", status: "Draft ready" },
          { role: "Linear · Eng Manager", score: "91%", status: "Generating…" },
        ].map(({ role, score, status }) => (
          <div key={role} className="rounded-xl p-3" style={{ background: "var(--lp-card2)", border: "1px solid var(--lp-bd)" }}>
            <div className="text-[10px] font-medium mb-1" style={{ color: "var(--lp-t1)" }}>{role}</div>
            <div className="flex items-center justify-between">
              <span className="text-[9px]" style={{ color: "var(--lp-t4)" }}>{status}</span>
              <span className="text-[9px] font-semibold text-purple-500">{score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewPreview() {
  const interviews = [
    { co: "Google", role: "Staff Engineer", date: "Tomorrow", time: "2:00 PM", type: "Technical", status: "Confirmed", sc: "rgba(34,197,94,0.12)", tc: "#4ade80", bc: "rgba(34,197,94,0.20)" },
    { co: "Stripe", role: "Senior SWE", date: "Thu Jun 12", time: "11:00 AM", type: "System Design", status: "Pending", sc: "rgba(245,158,11,0.12)", tc: "#fbbf24", bc: "rgba(245,158,11,0.20)" },
    { co: "Vercel", role: "Frontend Lead", date: "Mon Jun 16", time: "3:00 PM", type: "Culture Fit", status: "Scheduled", sc: "rgba(59,130,246,0.12)", tc: "#60a5fa", bc: "rgba(59,130,246,0.20)" },
  ];
  return (
    <div className="p-4 space-y-2.5">
      {interviews.map(({ co, role, date, time, type, status, sc, tc, bc }) => (
        <div key={co} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--lp-card2)", border: "1px solid var(--lp-bd)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd2)", color: "var(--lp-t1)" }}>
              {co.slice(0, 2)}
            </div>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: "var(--lp-t1)" }}>{role} · {co}</div>
              <div className="text-[9px]" style={{ color: "var(--lp-t4)" }}>{date} at {time} · {type}</div>
            </div>
          </div>
          <span className="text-[9px] font-medium px-2.5 py-1 rounded-full" style={{ background: sc, color: tc, border: `1px solid ${bc}` }}>{status}</span>
        </div>
      ))}
      <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)" }}>
        <Sparkles size={14} className="text-purple-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[10px] font-semibold text-purple-500 mb-0.5">AI Interview Prep Ready</div>
          <div className="text-[9px] leading-relaxed" style={{ color: "var(--lp-t4)" }}>15 predicted questions for your Google interview, with AI-suggested answers based on your CV and the job description.</div>
        </div>
      </div>
    </div>
  );
}

const TAB_CONTENT: Record<string, React.ComponentType> = { pipeline: PipelinePreview, analytics: AnalyticsPreview, ai: AIDraftPreview, interviews: InterviewPreview };

export function ProductPreviewSection() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const ActiveContent = TAB_CONTENT[activeTab];

  return (
    <section className="py-24" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-5">
            <LayoutDashboard size={12} className="text-cyan-500" />
            <span className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">Live product preview</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "var(--lp-t1)" }}>See it in action</h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: "var(--lp-t3)" }}>A powerful, clean interface designed to make your job search effortless.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-bd)", boxShadow: "var(--lp-shadow-lg)" }}
        >
          {/* Chrome */}
          <div className="flex items-center gap-2 px-5 py-3" style={{ background: "var(--lp-card2)", borderBottom: "1px solid var(--lp-bd)" }}>
            <div className="w-3 h-3 rounded-full bg-red-400/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-400/70" />
            <div className="ml-4 h-6 flex-1 max-w-sm rounded-md flex items-center px-3 gap-2" style={{ background: "var(--lp-card)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
              <span className="text-[10px]" style={{ color: "var(--lp-t4)" }}>app.newjobguru.com/dashboard</span>
            </div>
          </div>

          {/* Tabs — scrollable on mobile */}
          <div className="flex items-center gap-1 px-4 py-3 overflow-x-auto" style={{ background: "var(--lp-card3)", borderBottom: "1px solid var(--lp-bd3)", scrollbarWidth: "none" }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                onClick={() => setActiveTab(id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0"
                style={
                  activeTab === id
                    ? { background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }
                    : { color: "var(--lp-t4)", border: "1px solid transparent" }
                }
              >
                <Icon size={11} />
                {label}
              </motion.button>
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                <ActiveContent />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
