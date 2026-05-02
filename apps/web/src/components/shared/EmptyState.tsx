import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRightIcon, FileTextIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EmptyStateCta = {
  label: string;
  onClick?: () => void;
  href?: string;
};

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Chip-style link/button using `.jf-empty-cta` (lightweight CTA below copy). */
  cta?: EmptyStateCta;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

function EmptyStateCtaChip({ cta }: { cta: EmptyStateCta }) {
  if (!cta.href && !cta.onClick) return null;

  const content = (
    <>
      {cta.label}
      <ChevronRightIcon size={14} aria-hidden />
    </>
  );

  if (cta.href) {
    return (
      <Link href={cta.href} className="jf-empty-cta" onClick={cta.onClick}>
        {content}
      </Link>
    );
  }

  if (!cta.onClick) return null;

  return (
    <button
      type="button"
      className="jf-empty-cta inline-flex cursor-pointer border-0 bg-transparent p-0"
      onClick={cta.onClick}
    >
      {content}
    </button>
  );
}

export function EmptyState({ title, description, icon, cta, action, actionLabel, onAction, className }: EmptyStateProps) {
  const resolvedAction = action ?? (actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null);
  return (
    <div
      className={cn(
        "jf-empty animate-fade-in flex flex-col items-center justify-center rounded-[var(--r-md)] text-center",
        className
      )}
    >
      <div className="jf-empty-icon">{icon ?? <FileTextIcon size={22} className="text-[var(--accent-hi)]" />}</div>
      <div className="jf-empty-title">{title}</div>
      {description ? <p className="jf-empty-sub">{description}</p> : null}
      {cta && (cta.href || cta.onClick) ? (
        <div className="mt-1">
          <EmptyStateCtaChip cta={cta} />
        </div>
      ) : null}
      {resolvedAction ? <div className="mt-2">{resolvedAction}</div> : null}
    </div>
  );
}
