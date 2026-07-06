"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

const TAP_SLOP = 10;

type ScrollableTabBarContextValue = {
  consumeDragging: () => boolean;
};

const ScrollableTabBarContext = createContext<ScrollableTabBarContextValue | null>(null);

interface ScrollableTabBarProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Fit tabs in view with wrapping instead of horizontal scroll */
  wrap?: boolean;
}

export function ScrollableTabBar({ children, className, innerClassName, wrap = false }: ScrollableTabBarProps) {
  const draggingRef = useRef(false);
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null);

  const consumeDragging = useCallback(() => {
    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    pointerOrigin.current = null;
    return wasDragging;
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (wrap) return;
    pointerOrigin.current = { x: e.clientX, y: e.clientY };
    draggingRef.current = false;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (wrap || !pointerOrigin.current) return;
    const dx = Math.abs(e.clientX - pointerOrigin.current.x);
    const dy = Math.abs(e.clientY - pointerOrigin.current.y);
    if (dx > TAP_SLOP || dy > TAP_SLOP) {
      draggingRef.current = true;
    }
  };

  const onPointerEnd = () => {
    pointerOrigin.current = null;
  };

  const inner = (
    <div
      className={cn(
        wrap ? "flex flex-wrap items-center gap-1" : "inline-flex min-w-max items-center gap-1",
        "rounded-lg bg-[var(--surface-3)] p-1",
        innerClassName
      )}
    >
      {children}
    </div>
  );

  if (wrap) {
    return (
      <ScrollableTabBarContext.Provider value={{ consumeDragging }}>
        <div className={cn("px-1", className)}>{inner}</div>
      </ScrollableTabBarContext.Provider>
    );
  }

  return (
    <ScrollableTabBarContext.Provider value={{ consumeDragging }}>
      <div
        className={cn(
          "overflow-x-auto px-1 touch-pan-x [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {inner}
      </div>
    </ScrollableTabBarContext.Provider>
  );
}

interface ScrollableTabButtonProps {
  onPress: () => void;
  className?: string;
  children: ReactNode;
}

export function ScrollableTabButton({ onPress, className, children }: ScrollableTabButtonProps) {
  const ctx = useContext(ScrollableTabBarContext);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const activatedByPointer = useRef(false);

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse") return;
    if (!touchStart.current) return;

    const dx = Math.abs(e.clientX - touchStart.current.x);
    const dy = Math.abs(e.clientY - touchStart.current.y);
    touchStart.current = null;

    const wasDragging = ctx?.consumeDragging() ?? false;
    if (!wasDragging && dx <= TAP_SLOP && dy <= TAP_SLOP) {
      activatedByPointer.current = true;
      onPress();
      window.setTimeout(() => {
        activatedByPointer.current = false;
      }, 400);
    }
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={() => {
        if (activatedByPointer.current) return;
        if (ctx?.consumeDragging()) return;
        onPress();
      }}
      className={cn(scrollableTabButtonClass, className)}
    >
      {children}
    </button>
  );
}

export const scrollableTabButtonClass =
  "shrink-0 whitespace-nowrap rounded-md px-3 py-2.5 text-sm transition-colors min-h-[44px] touch-manipulation select-none active:opacity-80";
