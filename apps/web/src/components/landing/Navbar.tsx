"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, Sun, Moon } from "lucide-react";
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Light mode: white bg with border. Dark mode: dark purple glass.
  const navBg = isDark
    ? scrolled ? "rgba(10,6,20,0.92)" : "rgba(10,6,20,0.6)"
    : scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.85)";

  const navBorder = isDark
    ? "1px solid rgba(139,92,246,0.15)"
    : "1px solid rgba(15,23,42,0.08)";

  const navShadow = scrolled
    ? isDark
      ? "0 4px 32px rgba(0,0,0,0.5)"
      : "0 4px 24px rgba(0,0,0,0.08)"
    : "none";

  const linkColor = isDark ? "rgba(255,255,255,0.65)" : "#475569";
  const linkHover = isDark ? "#ffffff" : "#0f172a";
  const logoText = isDark ? "text-white" : "text-slate-800";
  const iconColor = isDark ? "rgba(255,255,255,0.5)" : "#64748b";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="flex items-center justify-between h-16 px-6 sm:px-10 transition-all duration-300"
            style={{
              background: navBg,
              borderBottom: navBorder,
              boxShadow: navShadow,
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden relative"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 0 16px rgba(99,102,241,0.45)" }}
              >
                <Zap size={14} className="text-white relative z-10" fill="white" />
                <motion.div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)" }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5 }}
                />
              </div>
              <span className={`font-bold text-[16px] tracking-tight hidden sm:block ${logoText}`}>
                NewJob{" "}
                <span style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Guru
                </span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="relative group text-sm px-3.5 py-2 rounded-lg font-medium transition-colors duration-150"
                  style={{ color: linkColor }}
                  onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
                  onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
                >
                  {label}
                  <span
                    className="absolute inset-x-3 bottom-1 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center rounded-full"
                    style={{ background: "linear-gradient(90deg, #4f46e5, #7c3aed)" }}
                  />
                </a>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Theme toggle */}
              <motion.button
                onClick={toggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ color: iconColor }}
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDark ? "sun" : "moon"}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              {/* Login */}
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded-lg font-medium transition-colors duration-150"
                style={{ color: linkColor }}
                onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
                onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
              >
                Login
              </Link>

              {/* CTA */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/login"
                  className="relative overflow-hidden inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    boxShadow: "0 0 20px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.2) 50%, transparent 65%)" }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                  />
                  <span className="relative z-10">Start Free</span>
                </Link>
              </motion.div>
            </div>

            {/* Mobile right */}
            <div className="md:hidden flex items-center gap-1.5">
              <button onClick={toggle} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: iconColor }}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ color: linkColor }}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileOpen ? "x" : "menu"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[64px] z-40 md:hidden overflow-hidden"
            style={{
              background: isDark ? "rgba(10,6,20,0.97)" : "rgba(255,255,255,0.98)",
              border: navBorder,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            <div className="px-4 py-4 space-y-0.5">
              {NAV_LINKS.map(({ label, href }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: linkColor }}
                  onClick={() => setMobileOpen(false)}
                  onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
                  onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                  {label}
                </motion.a>
              ))}
              <div
                className="pt-4 pb-1 flex flex-col gap-2.5 mt-2"
                style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(15,23,42,0.07)" }}
              >
                <Link
                  href="/login"
                  className="text-center py-3 rounded-xl text-sm font-medium"
                  style={{
                    color: linkColor,
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(15,23,42,0.1)",
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)",
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="text-center py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Start Free — No Credit Card
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
