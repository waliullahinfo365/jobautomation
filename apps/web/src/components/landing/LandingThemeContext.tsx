"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface LandingThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

const Ctx = createContext<LandingThemeCtx>({ isDark: false, toggle: () => {} });

export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  return (
    <Ctx.Provider value={{ isDark, toggle: () => setIsDark((d) => !d) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLandingTheme = () => useContext(Ctx);
