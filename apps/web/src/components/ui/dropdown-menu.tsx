"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export function useDropdownMenuContext() {
  return React.useContext(DropdownContext);
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, close }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx || !React.isValidElement(children)) return <>{children}</>;

  const childProps = children.props as {
    onClick?: React.MouseEventHandler<HTMLElement>;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: boolean | "menu";
  };

  return React.cloneElement(children, {
    "aria-expanded": ctx.open,
    "aria-haspopup": "menu",
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onClick?.(e);
      ctx.setOpen((prev) => !prev);
    },
  });
}

function DropdownMenuContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx?.open) return null;

  return (
    <div
      role="menu"
      className={cn(
        "absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] p-1 shadow-[var(--shadow-pop)]",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DropdownContext);
  return (
    <div
      role="menuitem"
      className={cn(
        "cursor-pointer rounded-sm px-2 py-1.5 text-sm text-[var(--text-2)] hover:bg-[var(--surface-3)]",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e);
        ctx?.close();
      }}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
