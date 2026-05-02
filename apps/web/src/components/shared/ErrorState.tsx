import { AlertTriangleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  description?: string;
  /** @deprecated use description */
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ErrorState({ title, description, message, actionLabel, onAction, className }: ErrorStateProps) {
  const body = description ?? message;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] px-6 py-14 text-center",
        className
      )}
    >
      <div className="jf-empty-icon border-[rgba(229,88,109,0.25)] bg-[var(--rose-bg)] text-[var(--rose)]">
        <AlertTriangleIcon size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-1)]">{title}</p>
        {body ? <p className="mt-1 text-sm text-[var(--text-3)]">{body}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button type="button" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
