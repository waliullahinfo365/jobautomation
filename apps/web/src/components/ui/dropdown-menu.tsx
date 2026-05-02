"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx || !React.isValidElement(children)) return <>{children}</>;

  const childProps = children.props as { onClick?: React.MouseEventHandler<HTMLElement> };

  return React.cloneElement(children, {
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
      className={cn(
        "cursor-pointer rounded-sm px-2 py-1.5 text-sm text-[var(--text-2)] hover:bg-[var(--surface-3)]",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e);
        ctx?.setOpen(false);
      }}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
