"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useLandingTheme } from "./LandingThemeContext";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggle } = useLandingTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bg = isDark
    ? "rgba(8,4,18,0.95)"
    : scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)";

  const border = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(15,23,42,0.08)";

  const linkClr = isDark ? "rgba(255,255,255,0.7)" : "#374151";
  const linkHover = isDark ? "#fff" : "#111827";

  return (
    <>
      {/* ── Main bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: bg,
          borderBottom: `1px solid ${border}`,
          boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.08)" : "none",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-[64px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <img src="/brand/logo.jpeg" alt="NewJob Guru" className="w-full h-full object-cover" />
            </div>
            <span
              className="font-bold text-[17px] tracking-tight hidden sm:block"
              style={{ color: isDark ? "#fff" : "#0f172a" }}
            >
              NewJob{" "}
              <span style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Guru
              </span>
            </span>
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 hover:bg-black/5"
                style={{ color: linkClr }}
                onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
                onMouseLeave={e => (e.currentTarget.style.color = linkClr)}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
              style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Login */}
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 hover:bg-black/5"
              style={{ color: linkClr }}
              onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
              onMouseLeave={e => (e.currentTarget.style.color = linkClr)}
            >
              Login
            </Link>

            {/* CTA */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-all duration-150 hover:opacity-90 hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                boxShadow: "0 1px 8px rgba(99,102,241,0.35)",
              }}
            >
              Start Free
            </Link>
          </div>

          {/* Mobile right */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
              style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#374151" }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile dropdown ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-0 top-[64px] z-40 md:hidden"
            style={{
              background: isDark ? "rgba(8,4,18,0.98)" : "#fff",
              borderBottom: `1px solid ${border}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="text-sm font-medium px-4 py-3 rounded-lg transition-colors hover:bg-black/5"
                  style={{ color: linkClr }}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${border}` }}>
                <Link
                  href="/login"
                  className="text-center py-2.5 rounded-lg text-sm font-medium border transition-colors"
                  style={{ color: linkClr, borderColor: border }}
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="text-center py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Start Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
