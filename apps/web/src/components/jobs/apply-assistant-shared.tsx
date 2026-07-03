import Link from "next/link";
import { ArrowRightIcon, DocumentsIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function MissingDocumentCard({
  title,
  description,
  buttonLabel,
  href,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent-hi)]">
        <DocumentsIcon size={20} />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[var(--text-1)]">{title}</p>
        <p className="mt-0.5 text-[12.5px] text-[var(--text-3)]">{description}</p>
      </div>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors",
          "bg-[var(--accent-bg)] text-[var(--accent-hi)] hover:bg-[var(--accent-ring)]"
        )}
      >
        {buttonLabel}
        <ArrowRightIcon size={13} />
      </Link>
    </div>
  );
}
