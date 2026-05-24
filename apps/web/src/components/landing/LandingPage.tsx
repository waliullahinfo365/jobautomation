"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LandingThemeProvider, useLandingTheme } from "./LandingThemeContext";
import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { SocialProofSection } from "./SocialProofSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { PricingSection } from "./PricingSection";
import { FAQSection } from "./FAQSection";
import { CTASection } from "./CTASection";
import { LandingFooter } from "./LandingFooter";

const DARK_VARS = `
  --lp-bg: #0d0a1a;
  --lp-bg2: rgba(16,10,32,0.99);
  --lp-nav: rgba(30,15,60,0.88);
  --lp-nav-bd: rgba(139,92,246,0.15);
  --lp-card: rgba(139,92,246,0.06);
  --lp-card2: rgba(139,92,246,0.09);
  --lp-card3: rgba(139,92,246,0.04);
  --lp-bd: rgba(139,92,246,0.14);
  --lp-bd2: rgba(139,92,246,0.22);
  --lp-bd3: rgba(139,92,246,0.08);
  --lp-t1: #f1f0ff;
  --lp-t2: #c4b8f0;
  --lp-t3: #9580c8;
  --lp-t4: #6b5a9e;
  --lp-t5: #4a3d6e;
  --lp-grid: rgba(139,92,246,1);
  --lp-grid-o: 0.04;
  --lp-hero-glow: rgba(99,102,241,0.45);
  --lp-hero-glow2: rgba(139,92,246,0.25);
  --lp-shadow: 0 4px 24px rgba(0,0,0,0.7);
  --lp-shadow-sm: 0 2px 8px rgba(0,0,0,0.5);
  --lp-shadow-lg: 0 20px 60px rgba(0,0,0,0.75);
  --lp-particle: rgba(139,92,246,0.6);
  --lp-section-sep: rgba(139,92,246,0.1);
`;

const LIGHT_VARS = `
  --lp-bg: #ffffff;
  --lp-bg2: rgba(255,255,255,0.99);
  --lp-nav: rgba(255,255,255,0.95);
  --lp-nav-bd: rgba(15,23,42,0.08);
  --lp-card: #ffffff;
  --lp-card2: #f8fafc;
  --lp-card3: #f1f5f9;
  --lp-bd: rgba(15,23,42,0.08);
  --lp-bd2: rgba(15,23,42,0.13);
  --lp-bd3: rgba(15,23,42,0.05);
  --lp-t1: #0f172a;
  --lp-t2: #1e293b;
  --lp-t3: #475569;
  --lp-t4: #64748b;
  --lp-t5: #94a3b8;
  --lp-grid: rgba(15,23,42,1);
  --lp-grid-o: 0.04;
  --lp-hero-glow: rgba(99,102,241,0.1);
  --lp-hero-glow2: rgba(139,92,246,0.06);
  --lp-shadow: 0 4px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
  --lp-shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
  --lp-shadow-lg: 0 12px 48px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05);
  --lp-particle: rgba(99,102,241,0.2);
  --lp-section-sep: rgba(15,23,42,0.07);
`;

function MobileStickyBar() {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 1.5, duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "var(--lp-nav)",
        borderTop: "1px solid var(--lp-bd2)",
        backdropFilter: "blur(24px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <Link
          href="/login"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm"
          style={{
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            boxShadow: "0 0 30px rgba(99,102,241,0.3)",
          }}
        >
          Start Free — No Credit Card
          <ArrowRight size={15} />
        </Link>
        <Link
          href="/login"
          className="px-5 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ color: "var(--lp-t2)", border: "1px solid var(--lp-bd2)", background: "var(--lp-card)" }}
        >
          Login
        </Link>
      </div>
    </motion.div>
  );
}

function Inner() {
  const { isDark } = useLandingTheme();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = ""; };
  }, []);

  return (
    <>
      <style>{`
        .lp-root { ${isDark ? DARK_VARS : LIGHT_VARS} }
        .lp-root * { transition: background-color 0.25s, border-color 0.25s, color 0.25s; }
        .lp-root a, .lp-root button { transition: all 0.2s !important; }
        .lp-root .no-transition { transition: none !important; }
        /* Mobile scroll snap for testimonials */
        .testimonial-scroll { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
        .testimonial-scroll > * { scroll-snap-align: start; }
        /* Hide scrollbar on testimonial row */
        .testimonial-scroll::-webkit-scrollbar { display: none; }
        .testimonial-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div
        className={`lp-root min-h-screen overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200 font-sans ${isDark ? "dark" : ""}`}
        style={{ background: "var(--lp-bg)", fontFamily: "var(--font-ui), ui-sans-serif, system-ui, sans-serif" }}
      >
        <Navbar />
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
        {/* Extra bottom padding on mobile so last section isn't covered by sticky bar */}
        <div className="h-20 md:hidden" />
        <LandingFooter />
        <MobileStickyBar />
      </div>
    </>
  );
}

export function LandingPage() {
  return (
    <LandingThemeProvider>
      <Inner />
    </LandingThemeProvider>
  );
}
