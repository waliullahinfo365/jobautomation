"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, Sun, Moon, Sparkles } from "lucide-react";
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
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Floating pill wrapper */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-4">
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl"
        >
          {/* Gradient border wrapper */}
          <div
            className="rounded-2xl transition-all duration-300"
            style={
              scrolled
                ? {
                    background: "linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.3), rgba(6,182,212,0.25))",
                    padding: "1px",
                  }
                : { padding: "1px", background: "transparent" }
            }
          >
            <div
              className="rounded-[15px] flex items-center justify-between h-14 px-4 sm:px-5 transition-all duration-300"
              style={{
                background: scrolled
                  ? "rgba(30,15,60,0.82)"
                  : "rgba(30,15,60,0.45)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                boxShadow: scrolled ? "0 8px 40px rgba(0,0,0,0.4)" : "none",
              }}
            >
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="relative w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", boxShadow: "0 0 18px rgba(99,102,241,0.5)" }}>
                  <Zap size={15} className="text-white relative z-10" fill="white" />
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)" }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                  />
                </div>
                <span className="font-bold text-[17px] tracking-tight hidden sm:block text-white">
                  NewJob{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
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
                    className="relative group text-sm px-4 py-2 rounded-lg transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                  >
                    {label}
                    <span className="absolute inset-x-3 bottom-1 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
                  </a>
                ))}
              </nav>

              {/* Desktop right */}
              <div className="hidden md:flex items-center gap-1.5">
                <motion.button
                  onClick={toggle}
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
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

                <Link
                  href="/login"
                  className="text-sm px-4 py-2 rounded-lg transition-colors duration-150 hover:text-white"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Login
                </Link>

                {/* Shimmer CTA */}
                <Link
                  href="/login"
                  className="relative overflow-hidden flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                    boxShadow: "0 0 22px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
                  />
                  <Sparkles size={11} className="relative z-10" />
                  <span className="relative z-10">Start Free</span>
                </Link>
              </div>

              {/* Mobile right */}
              <div className="md:hidden flex items-center gap-1.5">
                <button
                  onClick={toggle}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Toggle menu"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mobileOpen ? "close" : "open"}
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
          </div>
        </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[72px] z-40 md:hidden rounded-2xl overflow-hidden"
            style={{
              background: "rgba(30,15,60,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div className="px-4 py-4 space-y-0.5">
              {NAV_LINKS.map(({ label, href }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-medium transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                  {label}
                </motion.a>
              ))}
              <div className="pt-4 pb-1 flex flex-col gap-2.5 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <Link
                  href="/login"
                  className="text-center py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="relative overflow-hidden text-center py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
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
