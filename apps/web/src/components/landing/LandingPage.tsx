"use client";

import { useEffect } from "react";
import { LandingThemeProvider, useLandingTheme } from "./LandingThemeContext";
import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { SocialProofSection } from "./SocialProofSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { ProductPreviewSection } from "./ProductPreviewSection";
import { AutomationSection } from "./AutomationSection";
import { PricingSection } from "./PricingSection";
import { FAQSection } from "./FAQSection";
import { CTASection } from "./CTASection";
import { LandingFooter } from "./LandingFooter";

const DARK_VARS = `
  --lp-bg: #030712;
  --lp-bg2: rgba(9,14,30,0.99);
  --lp-nav: rgba(3,7,18,0.88);
  --lp-nav-bd: rgba(255,255,255,0.08);
  --lp-card: rgba(255,255,255,0.025);
  --lp-card2: rgba(255,255,255,0.04);
  --lp-card3: rgba(255,255,255,0.015);
  --lp-bd: rgba(255,255,255,0.07);
  --lp-bd2: rgba(255,255,255,0.12);
  --lp-bd3: rgba(255,255,255,0.04);
  --lp-t1: #ffffff;
  --lp-t2: #e2e8f0;
  --lp-t3: #94a3b8;
  --lp-t4: #64748b;
  --lp-t5: #475569;
  --lp-grid: rgba(148,163,184,1);
  --lp-grid-o: 0.025;
  --lp-hero-glow: rgba(59,130,246,0.35);
  --lp-hero-glow2: rgba(139,92,246,0.18);
  --lp-shadow: 0 4px 24px rgba(0,0,0,0.6);
  --lp-shadow-sm: 0 2px 8px rgba(0,0,0,0.4);
  --lp-shadow-lg: 0 20px 60px rgba(0,0,0,0.7);
  --lp-particle: rgba(99,102,241,0.6);
  --lp-section-sep: rgba(255,255,255,0.05);
`;

const LIGHT_VARS = `
  --lp-bg: #f8fafc;
  --lp-bg2: rgba(255,255,255,0.99);
  --lp-nav: rgba(248,250,252,0.92);
  --lp-nav-bd: rgba(15,23,42,0.09);
  --lp-card: rgba(255,255,255,0.95);
  --lp-card2: rgba(241,245,249,0.85);
  --lp-card3: rgba(255,255,255,0.8);
  --lp-bd: rgba(15,23,42,0.08);
  --lp-bd2: rgba(15,23,42,0.14);
  --lp-bd3: rgba(15,23,42,0.05);
  --lp-t1: #0f172a;
  --lp-t2: #1e293b;
  --lp-t3: #475569;
  --lp-t4: #64748b;
  --lp-t5: #94a3b8;
  --lp-grid: rgba(15,23,42,1);
  --lp-grid-o: 0.05;
  --lp-hero-glow: rgba(59,130,246,0.12);
  --lp-hero-glow2: rgba(139,92,246,0.07);
  --lp-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
  --lp-shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
  --lp-shadow-lg: 0 12px 48px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
  --lp-particle: rgba(99,102,241,0.25);
  --lp-section-sep: rgba(15,23,42,0.06);
`;

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
      `}</style>
      <div
        className={`lp-root min-h-screen overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200 ${isDark ? "dark" : ""}`}
        style={{ background: "var(--lp-bg)" }}
      >
        <Navbar />
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ProductPreviewSection />
        <AutomationSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
        <LandingFooter />
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
