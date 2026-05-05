"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CreateJobFormPayload } from "@/lib/api/jobs.api";
import type { JobPriority, JobSource, JobStatus } from "@/types/job";
import { showError } from "@/lib/ui/toast";

const SOURCES: { label: string; value: JobSource }[] = [
  { label: "LinkedIn", value: "LinkedIn" },
  { label: "Indeed", value: "Indeed" },
  { label: "Company Website", value: "Company Website" },
  { label: "Referral", value: "Referral" },
  { label: "Gmail", value: "Gmail" },
  { label: "Manual", value: "Manual" },
  { label: "Other", value: "Other" },
];

const STATUSES: { label: string; value: JobStatus }[] = [
  { label: "New", value: "New" },
  { label: "Research", value: "Research" },
  { label: "Drafting", value: "Drafting" },
  { label: "Ready to Apply", value: "Ready to Apply" },
  { label: "Applied", value: "Applied" },
  { label: "Interview", value: "Interview" },
  { label: "Offer", value: "Offer" },
  { label: "Rejected", value: "Rejected" },
  { label: "Archived", value: "Archived" },
];

const PRIORITIES: { label: string; value: JobPriority }[] = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
  { label: "Urgent", value: "Urgent" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateJobFormPayload) => Promise<void>;
  loading?: boolean;
};

export function AddJobModal({ open, onClose, onSubmit, loading }: Props) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [source, setSource] = useState<JobSource>("Manual");
  const [status, setStatus] = useState<JobStatus>("New");
  const [priority, setPriority] = useState<JobPriority>("Medium");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setCompany("");
    setPosition("");
    setSource("Manual");
    setStatus("New");
    setPriority("Medium");
    setLocation("");
    setJobUrl("");
    setSalaryRange("");
    setDeadline("");
    setDescription("");
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = company.trim();
    const p = position.trim();
    if (!c) {
      showError("Company name is required.");
      return;
    }
    if (!p) {
      showError("Position / job title is required.");
      return;
    }
    const u = jobUrl.trim();
    if (u && !u.startsWith("http://") && !u.startsWith("https://")) {
      showError("Job URL must start with http:// or https://");
      return;
    }
    await onSubmit({
      company: c,
      position: p,
      source,
      status,
      priority,
      location: location.trim() || undefined,
      jobUrl: u || undefined,
      salaryRange: salaryRange.trim() || undefined,
      deadline: deadline || undefined,
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => !loading && onClose()} aria-hidden />
      <div
        className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-job-title"
      >
        <h2 id="add-job-title" className="text-lg font-semibold tracking-tight text-[var(--text-1)]">
          Add job
        </h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">Create a new opportunity in your pipeline.</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Company name *</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Position / job title *</label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Senior Engineer" required />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Source</label>
              <Select
                value={source}
                onChange={(e) => setSource(e.target.value as JobSource)}
                options={SOURCES.map((o) => ({ label: o.label, value: o.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Status</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                options={STATUSES.map((o) => ({ label: o.label, value: o.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-3)]">Priority</label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as JobPriority)}
                options={PRIORITIES.map((o) => ({ label: o.label, value: o.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote / City" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Job URL</label>
            <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Salary range</label>
            <Input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="$120k – $150k" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Deadline</label>
            <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">Description</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, stack, team size…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Job"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
