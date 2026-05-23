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

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? "var(--lp-nav)" : "transparent",
          borderBottom: scrolled ? "1px solid var(--lp-nav-bd)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
          boxShadow: scrolled ? "var(--lp-shadow-sm)" : "none",
          transition: "background 0.3s, border-color 0.3s, backdrop-filter 0.3s, box-shadow 0.3s",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-[17px] tracking-tight" style={{ color: "var(--lp-t1)" }}>
              NewJob <span className="text-blue-500">Guru</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm px-4 py-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-150"
                style={{ color: "var(--lp-t3)" }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <motion.button
              onClick={toggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-blue-500/10 transition-colors"
              style={{ color: "var(--lp-t3)", border: "1px solid var(--lp-bd)" }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-all"
              style={{ color: "var(--lp-t3)" }}
            >
              Login
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
            >
              Start Free →
            </Link>
          </div>

          {/* Mobile right */}
          <div className="md:hidden flex items-center gap-2">
            <motion.button
              onClick={toggle}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ color: "var(--lp-t3)", border: "1px solid var(--lp-bd)" }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>
            <button
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--lp-t3)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden"
            style={{
              background: "var(--lp-nav)",
              borderBottom: "1px solid var(--lp-bd)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="px-6 py-5 space-y-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="block py-2.5 px-3 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-all text-base"
                  style={{ color: "var(--lp-t3)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-3 mt-4" style={{ borderTop: "1px solid var(--lp-bd)" }}>
                <Link
                  href="/login"
                  className="text-center py-3 rounded-xl font-medium transition-colors"
                  style={{ color: "var(--lp-t2)", border: "1px solid var(--lp-bd2)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="text-center py-3 font-semibold bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white shadow-lg shadow-blue-500/25"
                  onClick={() => setMobileOpen(false)}
                >
                  Start Free →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
