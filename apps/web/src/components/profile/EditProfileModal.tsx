"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/ui/toast";
import { updateProfile } from "@/lib/api/auth.api";
import { updateCurrentTenant } from "@/lib/api/tenants.api";
import { ApiError } from "@/lib/api/client";

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
    if (!name.trim() || !workspaceName.trim()) {
      showError("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const trimmedName = name.trim();
      const trimmedWorkspace = workspaceName.trim();
      const updates: Promise<unknown>[] = [];

      if (trimmedName !== currentProfile.name.trim()) {
        updates.push(updateProfile({ name: trimmedName }));
      }
      if (trimmedWorkspace !== currentProfile.workspaceName.trim()) {
        updates.push(updateCurrentTenant({ name: trimmedWorkspace }));
      }

      if (updates.length === 0) {
        onClose();
        return;
      }

      await Promise.all(updates);

      const updatedProfile = { name: trimmedName, email, workspaceName: trimmedWorkspace };
      onSave?.(updatedProfile);
      showSuccess("Profile updated.");
      onClose();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Failed to update profile.");
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
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">{t("profile.workspaceName")}</label>
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
