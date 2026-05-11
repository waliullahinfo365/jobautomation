"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showInfo } from "@/lib/ui/toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    name: string;
    email: string;
    workspaceName: string;
  };
  onSave?: (profile: { name: string; email: string; workspaceName: string }) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}: EditProfileModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(currentProfile.name);
  const [email, setEmail] = useState(currentProfile.email);
  const [workspaceName, setWorkspaceName] = useState(currentProfile.workspaceName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !workspaceName.trim()) {
      showInfo("Please fill in all fields.");
      return;
    }

    setIsSaving(true);
    try {
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedProfile = { name, email, workspaceName };
      onSave?.(updatedProfile);

      showInfo("Profile changes are saved locally for this demo. Backend profile update will be connected next.");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(currentProfile.name);
    setEmail(currentProfile.email);
    setWorkspaceName(currentProfile.workspaceName);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t("modal.editProfile")}
      description={t("profile.description")}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">{t("form.label.name")}</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("form.placeholder.fullName")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">{t("form.label.email")}</label>
          <Input type="email" value={email} disabled placeholder={t("form.error.emailNotChangeable")} />
          <p className="mt-1 text-xs text-[var(--text-3)]">{t("profile.documentLanguageNote")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">{t("settings.profileLanguage")}</label>
          <Input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder={t("form.placeholder.workspaceName")}
          />
        </div>

        <div className="border-t border-[var(--border-default)] pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
