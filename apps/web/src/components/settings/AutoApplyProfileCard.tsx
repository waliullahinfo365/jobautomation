"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/shared/SectionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/ui/toast";
import { getUserPreferences, updateUserPreferences, type UserPreferences } from "@/lib/api/user-preferences.api";

export function AutoApplyProfileCard() {
  const [prefs, setPrefs] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUserPreferences()
      .then((p) => setPrefs(p))
      .catch(() => void 0)
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof UserPreferences, value: string | number | boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateUserPreferences(prefs);
      setPrefs(updated);
      showSuccess("Auto-apply profile saved");
    } catch {
      showError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <SectionCard
      title="Auto-Apply Profile"
      description="These details are used by the Auto Apply bot to fill in job application forms on your behalf."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current job title">
          <Input
            value={prefs.currentTitle ?? ""}
            onChange={(e) => set("currentTitle", e.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </Field>
        <Field label="Phone number">
          <Input
            value={prefs.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+44 7700 900123"
          />
        </Field>
        <Field label="Location / City">
          <Input
            value={prefs.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            placeholder="London, UK"
          />
        </Field>
        <Field label="Years of experience">
          <Input
            type="number"
            value={prefs.yearsExperience ?? ""}
            onChange={(e) => set("yearsExperience", Number(e.target.value))}
            placeholder="5"
            min={0}
            max={50}
          />
        </Field>
        <Field label="Desired salary">
          <Input
            value={prefs.desiredSalary ?? ""}
            onChange={(e) => set("desiredSalary", e.target.value)}
            placeholder="£70,000 or Negotiable"
          />
        </Field>
        <Field label="Notice period">
          <Input
            value={prefs.noticePeriod ?? ""}
            onChange={(e) => set("noticePeriod", e.target.value)}
            placeholder="1 month"
          />
        </Field>
        <Field label="LinkedIn profile URL">
          <Input
            value={prefs.linkedinUrl ?? ""}
            onChange={(e) => set("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/yourname"
          />
        </Field>
        <Field label="Website / Portfolio URL">
          <Input
            value={prefs.websiteUrl ?? ""}
            onChange={(e) => set("websiteUrl", e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </Field>
        <Field label="Right to work (no visa required)">
          <select
            className="flex h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-1 text-sm text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)]"
            value={prefs.rightToWork === false ? "no" : "yes"}
            onChange={(e) => set("rightToWork", e.target.value === "yes")}
          >
            <option value="yes">Yes — I have the right to work</option>
            <option value="no">No — I need sponsorship</option>
          </select>
        </Field>
        <Field label="Requires visa sponsorship">
          <select
            className="flex h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-1 text-sm text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)]"
            value={prefs.requiresSponsorship ? "yes" : "no"}
            onChange={(e) => set("requiresSponsorship", e.target.value === "yes")}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--text-3)]">{label}</label>
      {children}
    </div>
  );
}
