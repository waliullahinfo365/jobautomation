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
    { label: "New", count: 8, color: "bg-slate-500", jobs: ["Senior Dev · Google", "Backend Eng · Meta", "SWE · Stripe"] },
    { label: "Saved", count: 12, color: "bg-blue-500", jobs: ["Frontend · Vercel", "Full Stack · Linear", "React Dev · Notion"] },
    { label: "Applied", count: 5, color: "bg-purple-500", jobs: ["Platform Eng · Airbnb", "Senior SWE · Figma"] },
    { label: "Interview", count: 3, color: "bg-green-500", jobs: ["Staff Eng · Shopify"] },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
      {stages.map(({ label, count, color, jobs }) => (
        <div key={label} className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className={`flex items-center justify-between px-3 py-2 border-b border-white/[0.05]`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] font-semibold text-slate-400">{label}</span>
            </div>
            <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${color} bg-opacity-20`}>{count}</span>
          </div>
          <div className="p-2 space-y-1.5">
            {jobs.map((job) => (
              <div key={job} className="text-[9px] text-slate-400 bg-white/[0.03] rounded-lg px-2 py-1.5 border border-white/[0.04] truncate hover:text-slate-300 cursor-default">
                {job}
              </div>
            ))}
            <div className="text-[9px] text-slate-600 text-center py-1">+{count - jobs.length} more</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPreview() {
  const bars = [65, 82, 45, 91, 78, 55, 88, 72, 95, 60, 84, 70];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Response Rate", value: "34%", change: "+12%", up: true },
          { label: "Interview Rate", value: "18%", change: "+7%", up: true },
          { label: "Avg Time to Reply", value: "4.2d", change: "-1.3d", up: true },
        ].map(({ label, value, change, up }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[9px] text-slate-500 mb-1">{label}</div>
            <div className="text-base font-bold text-white">{value}</div>
            <div className={`text-[9px] ${up ? "text-green-400" : "text-red-400"}`}>{change} vs last month</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-white/[0.06] p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="text-[10px] font-semibold text-slate-400 mb-3">Applications per Month</div>
        <div className="flex items-end gap-1.5 h-20">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.5 }}
                className="w-full rounded-t-sm"
                style={{ background: i === 4 ? "linear-gradient(180deg, #60a5fa, #3b82f6)" : "rgba(148,163,184,0.15)" }}
              />
              <span className="text-[7px] text-slate-600">{months[i]}</span>
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
      <div className="rounded-xl border border-blue-500/20 p-4" style={{ background: "rgba(59,130,246,0.05)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">AI Cover Letter — Stripe</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Senior Software Engineer · San Francisco</div>
          </div>
          <span className="text-[9px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/20">94% match</span>
        </div>
        <div className="space-y-1.5">
          {[
            "Dear Stripe Engineering Team,",
            "I am excited to apply for the Senior Software Engineer role. With 6+ years building scalable payment infrastructure at high-growth startups, I bring exactly the expertise your team needs.",
            "My experience with distributed systems, TypeScript, and API design aligns directly with Stripe's technical requirements. I've led teams that processed $2B+ in transactions annually...",
          ].map((line, i) => (
            <p key={i} className={`text-[10px] leading-relaxed ${i === 0 ? "text-white font-medium" : "text-slate-400"}`}>{line}</p>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }}
              initial={{ width: "0%" }}
              whileInView={{ width: "94%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[9px] text-slate-500">94% personalized</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { role: "Vercel · Frontend Lead", score: "87%", status: "Draft ready" },
          { role: "Linear · Eng Manager", score: "91%", status: "Generating…" },
        ].map(({ role, score, status }) => (
          <div key={role} className="rounded-xl border border-white/[0.06] p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium text-white mb-1">{role}</div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500">{status}</span>
              <span className="text-[9px] font-semibold text-purple-400">{score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewPreview() {
  const interviews = [
    { co: "Google", role: "Staff Engineer", date: "Tomorrow", time: "2:00 PM", type: "Technical", status: "Confirmed", statusClass: "text-green-400 bg-green-500/15 border-green-500/20" },
    { co: "Stripe", role: "Senior SWE", date: "Thu, Jun 12", time: "11:00 AM", type: "System Design", status: "Pending", statusClass: "text-amber-400 bg-amber-500/15 border-amber-500/20" },
    { co: "Vercel", role: "Frontend Lead", date: "Mon, Jun 16", time: "3:00 PM", type: "Culture Fit", status: "Scheduled", statusClass: "text-blue-400 bg-blue-500/15 border-blue-500/20" },
  ];

  return (
    <div className="p-4 space-y-2.5">
      {interviews.map(({ co, role, date, time, type, status, statusClass }) => (
        <div key={co} className="flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3 hover:bg-white/[0.02] transition-colors" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {co.slice(0, 2)}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white">{role} · {co}</div>
              <div className="text-[9px] text-slate-500">{date} at {time} · {type}</div>
            </div>
          </div>
          <span className={`text-[9px] font-medium px-2.5 py-1 rounded-full border ${statusClass}`}>{status}</span>
        </div>
      ))}
      <div className="rounded-xl border border-purple-500/20 p-3 flex items-start gap-3" style={{ background: "rgba(139,92,246,0.05)" }}>
        <Sparkles size={14} className="text-purple-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-[10px] font-semibold text-purple-300 mb-0.5">AI Interview Prep Ready</div>
          <div className="text-[9px] text-slate-500 leading-relaxed">15 predicted questions for your Google interview, with AI-suggested answers based on your CV and the job description.</div>
        </div>
      </div>
    </div>
  );
}

const TAB_CONTENT = {
  pipeline: PipelinePreview,
  analytics: AnalyticsPreview,
  ai: AIDraftPreview,
  interviews: InterviewPreview,
};

export function ProductPreviewSection() {
  const [activeTab, setActiveTab] = useState("pipeline");

  const ActiveContent = TAB_CONTENT[activeTab as keyof typeof TAB_CONTENT];

  return (
    <section className="py-24 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-5">
            <LayoutDashboard size={12} className="text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Live product preview</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            See it in action
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            A powerful, clean interface designed to make your job search effortless.
          </p>
        </motion.div>

        {/* Mock browser */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
          style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.97), rgba(9,14,30,0.99))" }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.25), transparent 60%)" }}
          />

          {/* Chrome */}
          <div className="relative flex items-center gap-2 px-5 py-3 border-b border-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <div className="ml-4 h-6 flex-1 max-w-sm bg-white/[0.05] rounded-md flex items-center px-3 gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
              <span className="text-[10px] text-slate-500">app.newjobguru.com/dashboard</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="relative flex items-center gap-1 px-4 py-3 border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.015)" }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === id
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="relative min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
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
