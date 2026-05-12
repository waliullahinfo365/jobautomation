"use client";

import { useState } from "react";
import { SettingSectionCard } from "./SettingSectionCard";
import { Button } from "@/components/ui/button";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { SecuritySettingsModal } from "./SecuritySettingsModal";
import { useTranslation } from "@/i18n/useTranslation";

export function SecuritySection() {
  const { t } = useTranslation();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <SettingSectionCard
        title={t("settings.security.title")}
        description={t("settings.security.description")}
      >
        <div className="space-y-2 text-sm">
          <Field
            label={t("settings.security.password")}
            value={t("settings.security.passwordLastUpdated")}
          />
          <Field
            label={t("settings.security.twoFactor")}
            value={t("settings.security.twoFactorDisabled")}
          />
          <Field
            label={t("settings.security.activeSessions")}
            value={t("settings.security.activeSessionsValue")}
          />
          <Field
            label={t("settings.security.apiKeys")}
            value={t("settings.security.noApiKeys")}
          />
          <Field
            label={t("settings.security.auditLogs")}
            value={t("settings.security.auditLogsAvailable")}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>
            {t("settings.security.managePassword")}
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            {t("settings.security.manageSettings")}
          </Button>
        </div>
      </SettingSectionCard>

      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
      />
      <SecuritySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="text-[var(--text-2)]">{value}</p>
    </div>
  );
}
