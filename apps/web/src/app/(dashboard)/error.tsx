"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-[var(--text-1)]">Something went wrong</h1>
      <p className="text-sm text-[var(--text-3)]">
        The page hit a temporary error. Try again — if it keeps happening, reload after clearing the site cache.
      </p>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button type="button" className="min-h-[44px] w-full sm:w-auto" onClick={() => reset()}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] w-full sm:w-auto"
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
        >
          Reload page
        </Button>
      </div>
    </div>
  );
}
