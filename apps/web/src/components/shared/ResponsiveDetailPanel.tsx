"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface ResponsiveDetailPanelProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ResponsiveDetailPanel({ open, onClose, children }: ResponsiveDetailPanelProps) {
  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {open ? (
        <div className={cn("fixed inset-0 z-50 flex", isMobile ? "items-end" : "items-stretch")}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            initial={isMobile ? { y: "100%", opacity: 0 } : { x: 40, opacity: 0 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { y: "100%", opacity: 0 } : { x: 24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "relative z-10 flex w-full flex-col overflow-hidden bg-card",
              isMobile
                ? "max-h-[min(90dvh,100%)] rounded-t-2xl border-t border-border shadow-xl"
                : "ml-auto h-full max-w-2xl border-l border-border"
            )}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" aria-hidden />
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
              {children}
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
