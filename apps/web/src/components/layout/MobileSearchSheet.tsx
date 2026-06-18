"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n/useTranslation";

interface MobileSearchSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSearchSheet({ open, onClose }: MobileSearchSheetProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    onClose();
    if (q) router.push(`/jobs?q=${encodeURIComponent(q)}`);
    else router.push("/jobs");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="absolute inset-x-0 top-0 border-b border-[var(--border-default)] bg-[var(--surface-1)] p-3 shadow-lg"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <SearchIcon size={18} className="shrink-0 text-[var(--text-4)]" />
          <Input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("topbar.searchPlaceholder")}
            className="flex-1"
            aria-label={t("topbar.searchPlaceholder")}
          />
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.close")}
          </Button>
        </form>
      </div>
    </div>
  );
}
