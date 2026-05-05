"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showError } from "@/lib/ui/toast";

type ImportRow = {
  name: string;
  email?: string;
  company?: string;
  role?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (rows: ImportRow[]) => Promise<void>;
  loading?: boolean;
};

export function ImportContactsModal({ open, onClose, onImport, loading }: Props) {
  const [raw, setRaw] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rows = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = "", email = "", company = "", role = ""] = line.split(",").map((v) => v.trim());
        return { name, email: email || undefined, company: company || undefined, role: role || undefined };
      })
      .filter((r) => r.name.length > 0);
    if (rows.length === 0) {
      showError("Add at least one valid contact line.");
      return;
    }
    await onImport(rows);
    setRaw("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => !loading && onClose()} aria-hidden />
      <div
        className="relative z-50 w-full max-w-lg rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold text-[var(--text-1)]">Import contacts</h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">Paste contacts as: Name, Email, Company, Role</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <textarea
            className="flex min-h-[180px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"Jane Doe, jane@acme.com, Acme, Recruiter\nJohn Smith, john@corp.io, Corp, Hiring Manager"}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Importing..." : "Import Contacts"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
