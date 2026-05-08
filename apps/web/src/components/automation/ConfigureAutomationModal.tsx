"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AutomationModule, AutomationStatus } from "@/types/automation";
import { automationUiStatusToBackend } from "@/lib/utils/resource";
import { useTranslation } from "@/i18n/useTranslation";

type Props = {
  open: boolean;
  onClose: () => void;
  modules: AutomationModule[];
  initialModuleId?: string | null;
  onSave: (moduleKey: string, payload: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
};

export function ConfigureAutomationModal({ open, onClose, modules, initialModuleId, onSave, loading }: Props) {
  const { t } = useTranslation();
  const statusOptions = useMemo(
    () =>
      [
        { value: "Active" as const, label: t("automation.moduleStatus.active") },
        { value: "Paused" as const, label: t("automation.moduleStatus.paused") },
        { value: "Failed" as const, label: t("automation.moduleStatus.failed") },
        { value: "Needs Setup" as const, label: t("automation.moduleStatus.needsSetup") },
      ] as const,
    [t]
  );

  const moduleOptions = useMemo(
    () => modules.map((m) => ({ label: `${m.name} (${m.id})`, value: m.id })),
    [modules]
  );

  const [moduleId, setModuleId] = useState("");
  const [status, setStatus] = useState<AutomationStatus>("Active");
  const [schedule, setSchedule] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open || !modules.length) return;
    const pick =
      initialModuleId && modules.some((m) => m.id === initialModuleId) ? initialModuleId : modules[0]!.id;
    setModuleId(pick);
  }, [open, initialModuleId, modules]);

  const selected = useMemo(() => modules.find((m) => m.id === moduleId), [modules, moduleId]);

  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status);
    setSchedule(selected.schedule ?? "");
    setTriggerType(selected.triggerType ?? "");
    setDescription(selected.description ?? "");
    setEnabled(true);
  }, [selected]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleId) return;
    await onSave(moduleId, {
      status: automationUiStatusToBackend(status),
      schedule: schedule.trim() || undefined,
      triggerType: triggerType.trim() || undefined,
      enabled,
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => !loading && onClose()} aria-hidden />
      <div
        className="relative z-50 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="configure-auto-title"
      >
        <h2 id="configure-auto-title" className="text-lg font-semibold tracking-tight text-[var(--text-1)]">
          {t("automation.configureModal.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">{t("automation.configureModal.description")}</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("automation.configureModal.moduleLabel")}</label>
            <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)} options={moduleOptions} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("automation.configureModal.statusLabel")}</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as AutomationStatus)}
              options={statusOptions.map((o) => ({ label: o.label, value: o.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            {t("automation.configureModal.moduleEnabled")}
          </label>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("automation.configureModal.scheduleLabel")}</label>
            <Input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder={t("automation.configureModal.schedulePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("automation.configureModal.triggerTypeLabel")}</label>
            <Input
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              placeholder={t("automation.configureModal.triggerPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-3)]">{t("automation.configureModal.descriptionLabel")}</label>
            <textarea
              className="flex min-h-[88px] w-full rounded-[var(--r-sm,8px)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("automation.configureModal.descriptionPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !moduleId}>
              {loading ? t("automation.configureModal.saving") : t("automation.configureModal.saveButton")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
