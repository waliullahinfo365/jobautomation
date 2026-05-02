"use client";

import { ThemeIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-[34px] w-[34px] rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
      aria-label="Toggle theme"
    >
      <ThemeIcon size={15} />
    </Button>
  );
}
