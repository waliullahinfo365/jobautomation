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
        "flex flex-col items-center justify-center gap-3 rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] px-6 py-14 text-center",
        className
      )}
    >
      <LoaderIcon size={28} className="text-[var(--accent-hi)]" />
      <div>
        <p className="text-sm font-semibold text-[var(--text-1)]">{title}</p>
        {description ? <p className="mt-1 text-sm text-[var(--text-3)]">{description}</p> : null}
      </div>
    </div>
  );
}
