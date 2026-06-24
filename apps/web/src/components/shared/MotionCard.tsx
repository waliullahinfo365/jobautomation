"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MotionCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2 }}
      className={cn("premium-card min-w-0 overflow-hidden", className)}
    >
      {children}
    </motion.div>
  );
}
