"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showInfo, showError } from "@/lib/ui/toast";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (passwords: { currentPassword: string; newPassword: string }) => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSave,
}: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!currentPassword.trim()) {
      showError("Current password is required.");
      return;
    }

    if (!newPassword.trim()) {
      showError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      showError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("New password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate password change
      await new Promise((resolve) => setTimeout(resolve, 500));

      onSave?.({
        currentPassword,
        newPassword,
      });

      showInfo("Password change will be connected after password reset/security endpoints are enabled.");
      handleReset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t("modal.changePassword")}
      description={t("profile.changePassword")}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">{t("form.label.currentPassword")}</label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("form.placeholder.currentPassword")}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">{t("form.label.newPassword")}</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("form.placeholder.newPassword")}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">{t("form.label.confirmPassword")}</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("form.placeholder.confirmPassword")}
            disabled={isSubmitting}
          />
        </div>

        <div className="border-t border-[var(--border-default)] pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
