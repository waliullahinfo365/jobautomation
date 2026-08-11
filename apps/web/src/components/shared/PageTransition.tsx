"use client";

import { motion } from "framer-motion";

/**
 * Opacity-only transition — never animate `transform`/`y`.
 * A transformed ancestor becomes the containing block for `position: fixed`
 * descendants, which traps sticky CTAs and makes buttons unreachable.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="min-w-0 w-full max-w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
