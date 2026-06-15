"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnBackdropClick?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnBackdropClick = true,
}: ModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-y-contain bg-black/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={cn(
          "relative my-auto flex w-full min-w-0 max-h-[min(100dvh-1.25rem,56rem)] flex-col overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] shadow-lg sm:rounded-lg",
          sizeStyles[size]
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[var(--border-default)] px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-base font-semibold text-[var(--text-1)] sm:text-lg">{title}</h2>
              {description && <p className="mt-1 text-sm text-[var(--text-3)]">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-m-1 shrink-0 rounded-md p-2 text-[var(--text-3)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] touch-manipulation"
              aria-label={t("common.closeModal")}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content — scrolls on small screens / long bodies */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">{children}</div>
      </div>
    </div>
  );
}
