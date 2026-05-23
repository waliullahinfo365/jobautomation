"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const COMPANY_LOGOS = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple",
  "Stripe", "Shopify", "Airbnb", "Notion", "Figma",
];

const TESTIMONIALS = [
  {
    quote: "This completely replaced my spreadsheets. I used to track 40+ applications manually — now it's all automated. Got 3 interviews in my first week.",
    name: "Marcus Heidenreich",
    title: "Senior Frontend Engineer",
    location: "Berlin, Germany",
    avatar: "MH",
    avatarBg: "linear-gradient(135deg,#3b82f6,#06b6d4)",
    stars: 5,
  },
  {
    quote: "The Gmail integration is magical. It automatically finds job opportunities in my inbox and adds them to my pipeline. I save at least 3 hours every single week.",
    name: "Priya Nair",
    title: "Product Manager",
    location: "London, UK",
    avatar: "PN",
    avatarBg: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    stars: 5,
  },
  {
    quote: "Best job automation platform I've used. The AI cover letters actually sound like me — not generic. Landed my dream role at a Series B startup after 3 weeks.",
    name: "Jordan Williams",
    title: "Full Stack Developer",
    location: "Toronto, Canada",
    avatar: "JW",
    avatarBg: "linear-gradient(135deg,#22c55e,#10b981)",
    stars: 5,
  },
  {
    quote: "As an international job seeker, multi-language support was a game changer. I applied to roles in Germany, Netherlands, and Switzerland all from one place.",
    name: "Yuki Tanaka",
    title: "Data Scientist",
    location: "Amsterdam, Netherlands",
    avatar: "YT",
    avatarBg: "linear-gradient(135deg,#f97316,#ef4444)",
    stars: 5,
  },
  {
    quote: "The follow-up automation alone is worth it. I never have to remember to send a follow-up email — it happens automatically. My response rate went up 60%.",
    name: "Sofia Marchetti",
    title: "UX Designer",
    location: "Milan, Italy",
    avatar: "SM",
    avatarBg: "linear-gradient(135deg,#ec4899,#f43f5e)",
    stars: 5,
  },
  {
    quote: "I was applying to 15+ jobs per week. Without NewJob Guru I'd be drowning. The pipeline view shows exactly where each application is and what I need to do.",
    name: "David Osei",
    title: "Software Engineer",
    location: "Lagos, Nigeria",
    avatar: "DO",
    avatarBg: "linear-gradient(135deg,#6366f1,#3b82f6)",
    stars: 5,
  },
];

const STATS = [
  { target: 10000, suffix: "+", label: "Applications Tracked", prefix: "" },
  { target: 4.9, suffix: "/5", label: "Average Rating", prefix: "" },
  { target: 95, suffix: "%", label: "Automation Success", prefix: "" },
  { target: 40, suffix: "+", label: "Countries", prefix: "" },
];

function AnimatedCounter({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const isDecimal = target % 1 !== 0;
    const duration = 1800;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = isDecimal ? parseFloat((eased * target).toFixed(1)) : Math.floor(eased * target);
      setCount(val);
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, target]);

  const display = target >= 1000
    ? (count >= 1000 ? `${Math.floor(count / 1000)}k` : count.toString())
    : count.toString();

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function SocialProofSection() {
  return (
    <section className="py-20 overflow-hidden" style={{ borderTop: "1px solid var(--lp-section-sep)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trusted by */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium uppercase tracking-widest mb-8" style={{ color: "var(--lp-t5)" }}>
            Used by professionals at top companies worldwide
          </p>

          <div className="relative overflow-hidden">
            <div className="flex gap-12 items-center" style={{ animation: "scrollLogos 25s linear infinite" }}>
              {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="shrink-0 font-bold text-base tracking-tight cursor-default hover:text-blue-500 transition-colors"
                  style={{ color: "var(--lp-t5)" }}
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: "linear-gradient(90deg, var(--lp-bg), transparent)" }} />
            <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: "linear-gradient(-90deg, var(--lp-bg), transparent)" }} />
          </div>
        </motion.div>

        {/* Animated stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden mb-16"
          style={{ background: "var(--lp-bd)", border: "1px solid var(--lp-bd)" }}
        >
          {STATS.map(({ target, suffix, label, prefix }) => (
            <div key={label} className="text-center py-7 px-4" style={{ background: "var(--lp-card2)" }}>
              <div
                className="text-3xl font-bold bg-clip-text text-transparent mb-1"
                style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}
              >
                <AnimatedCounter target={target} suffix={suffix} prefix={prefix} />
              </div>
              <div className="text-xs font-medium" style={{ color: "var(--lp-t5)" }}>{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Section header */}
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: "var(--lp-t1)" }}
          >
            Job seekers love NewJob Guru
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base"
            style={{ color: "var(--lp-t3)" }}
          >
            Join thousands who automated their job search and landed their dream role.
          </motion.p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map(({ quote, name, title, location, avatar, avatarBg, stars }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-2xl p-6 flex flex-col gap-4 cursor-default"
              style={{ background: "var(--lp-card)", border: "1px solid var(--lp-bd)", boxShadow: "var(--lp-shadow-sm)" }}
            >
              <StarRating count={stars} />
              <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--lp-t2)" }}>&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid var(--lp-bd3)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-lg" style={{ background: avatarBg }}>
                  {avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--lp-t1)" }}>{name}</div>
                  <div className="text-[11px]" style={{ color: "var(--lp-t4)" }}>{title} · {location}</div>
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
