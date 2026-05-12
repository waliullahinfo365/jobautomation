"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { showInfo } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: boolean;
}

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: SecuritySettings) => void;
}

export function SecuritySettingsModal({
  isOpen,
  onClose,
  onSave,
}: SecuritySettingsModalProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof SecuritySettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      onSave?.(settings);
      showInfo(t("settings.security.modal.saveSuccess"));
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("settings.security.modal.title")}
      description={t("settings.security.modal.description")}
      size="md"
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <ToggleRow
            label={t("settings.security.modal.twoFactorAuth")}
            description={t("settings.security.modal.twoFactorAuthDesc")}
            checked={settings.twoFactorAuth}
            onChange={() => handleToggle("twoFactorAuth")}
            disabled={isSaving}
          />

          <ToggleRow
            label={t("settings.security.modal.loginAlerts")}
            description={t("settings.security.modal.loginAlertsDesc")}
            checked={settings.loginAlerts}
            onChange={() => handleToggle("loginAlerts")}
            disabled={isSaving}
          />

          <ToggleRow
            label={t("settings.security.modal.sessionTimeout")}
            description={t("settings.security.modal.sessionTimeoutDesc")}
            checked={settings.sessionTimeout}
            onChange={() => handleToggle("sessionTimeout")}
            disabled={isSaving}
          />
        </div>

        <div className="bg-[var(--surface-3)] rounded-lg p-3 text-xs text-[var(--text-3)]">
          <p>
            {t("settings.security.modal.demoNotice")}
          </p>
        </div>

        <div className="border-t border-[var(--border-default)] pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("settings.security.modal.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? t("settings.security.modal.saving")
              : t("settings.security.modal.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-3)] transition-colors">
      <div>
        <p className="text-sm font-medium text-[var(--text-2)]">{label}</p>
        <p className="text-xs text-[var(--text-3)]">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="cursor-pointer w-5 h-5"
      />
    </div>
  );
}
