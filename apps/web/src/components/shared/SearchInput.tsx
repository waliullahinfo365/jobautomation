"use client";

import { CloseIcon, SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchInput({ placeholder = "Search…", value, onChange, className }: SearchInputProps) {
  const [internal, setInternal] = useState(value ?? "");
  const current = value !== undefined ? value : internal;

  const handleChange = (v: string) => {
    setInternal(v);
    onChange?.(v);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="h-[34px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background pl-9 pr-9 text-[13px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {current ? (
        <button
          type="button"
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <CloseIcon size={14} />
        </button>
      ) : null}
    </div>
  );
}
