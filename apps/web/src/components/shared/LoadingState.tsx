import { LoaderIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function LoadingState({ title, description, className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "mobile-state-card flex min-h-[min(52vh,420px)] flex-col items-center justify-center gap-4 rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] px-6 py-14 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-bg)] opacity-50"
          aria-hidden
        />
        <LoaderIcon size={28} className="relative text-[var(--accent-hi)]" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[var(--text-1)] sm:text-sm">{title}</p>
        {description ? <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-3)]">{description}</p> : null}
      </div>
    </div>
  );
}
