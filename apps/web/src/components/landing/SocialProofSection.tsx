"use client";

import { motion } from "framer-motion";

const COMPANY_LOGOS = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple",
  "Stripe", "Shopify", "Airbnb", "Notion", "Figma",
];

const TESTIMONIALS = [
  {
    quote: "This completely replaced my spreadsheets. I used to track 40+ applications manually — now it's all automated. I got 3 interviews in my first week using the AI cover letters.",
    name: "Marcus Heidenreich",
    title: "Senior Frontend Engineer",
    location: "Berlin, Germany",
    avatar: "MH",
    avatarBg: "from-blue-500 to-cyan-500",
    stars: 5,
  },
  {
    quote: "The Gmail integration is magical. It automatically finds job opportunities in my inbox and adds them to my pipeline. I save at least 3 hours every week I used to spend on admin.",
    name: "Priya Nair",
    title: "Product Manager",
    location: "London, UK",
    avatar: "PN",
    avatarBg: "from-purple-500 to-pink-500",
    stars: 5,
  },
  {
    quote: "Best job automation platform I've used. The AI cover letters actually sound like me — not generic. Landed my dream role at a Series B startup after 3 weeks of using it.",
    name: "Jordan Williams",
    title: "Full Stack Developer",
    location: "Toronto, Canada",
    avatar: "JW",
    avatarBg: "from-green-500 to-emerald-500",
    stars: 5,
  },
  {
    quote: "As an international job seeker, multi-language support was a game changer. I applied to roles in Germany, Netherlands, and Switzerland all from one place. Absolutely brilliant.",
    name: "Yuki Tanaka",
    title: "Data Scientist",
    location: "Amsterdam, Netherlands",
    avatar: "YT",
    avatarBg: "from-orange-500 to-red-500",
    stars: 5,
  },
  {
    quote: "The follow-up automation alone is worth it. I never have to remember to send a follow-up email — it happens automatically at the right time. My response rate went up 60%.",
    name: "Sofia Marchetti",
    title: "UX Designer",
    location: "Milan, Italy",
    avatar: "SM",
    avatarBg: "from-pink-500 to-rose-500",
    stars: 5,
  },
  {
    quote: "I was applying to 15+ jobs per week. Without NewJob Guru I'd be drowning. The pipeline view shows exactly where each application is and what action I need to take next.",
    name: "David Osei",
    title: "Software Engineer",
    location: "Lagos, Nigeria",
    avatar: "DO",
    avatarBg: "from-indigo-500 to-blue-500",
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function SocialProofSection() {
  return (
    <section className="py-20 overflow-hidden border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trusted by */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mb-8">
            Used by professionals at top companies worldwide
          </p>

          {/* Logo scroll */}
          <div className="relative overflow-hidden">
            <div className="flex gap-12 items-center" style={{ animation: "scrollLogos 25s linear infinite" }}>
              {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="shrink-0 text-slate-600 font-bold text-base tracking-tight hover:text-slate-400 transition-colors cursor-default"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: "linear-gradient(90deg, #030712, transparent)" }} />
            <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: "linear-gradient(-90deg, #030712, transparent)" }} />
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.08] mb-16"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {[
            { value: "10,000+", label: "Applications Tracked" },
            { value: "4.9/5", label: "Average Rating" },
            { value: "95%", label: "Automation Success" },
            { value: "40+", label: "Countries" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center py-6 px-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div
                className="text-3xl font-bold bg-clip-text text-transparent mb-1"
                style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}
              >
                {value}
              </div>
              <div className="text-xs text-slate-500 font-medium">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-white mb-3"
          >
            Job seekers love NewJob Guru
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-base"
          >
            Join thousands who automated their job search and landed their dream role.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map(({ quote, name, title, location, avatar, avatarBg, stars }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-white/[0.08] p-6 flex flex-col gap-4 group hover:border-white/20 transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)" }}
            >
              <StarRating count={stars} />
              <p className="text-slate-300 text-sm leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-lg`}
                >
                  {avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{name}</div>
                  <div className="text-[11px] text-slate-500">{title} · {location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scrollLogos {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
