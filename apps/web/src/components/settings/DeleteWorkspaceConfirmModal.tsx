"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showInfo, showError } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";

interface DeleteWorkspaceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteWorkspaceConfirmModal({
  isOpen,
  onClose,
}: DeleteWorkspaceConfirmModalProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isConfirmed = confirmText.toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed) {
      showError(t("settings.dataStorage.deleteModal.confirmError"));
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate delete operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      showInfo(t("settings.dataStorage.deleteModal.disabledMsg"));
      handleReset();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setConfirmText("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t("settings.dataStorage.deleteModal.title")}
      description={t("settings.dataStorage.deleteModal.description")}
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4">
          <p className="text-sm text-red-200 font-medium">
            {t("settings.dataStorage.deleteModal.warningLabel")}
          </p>
          <p className="text-sm text-[var(--text-2)] mt-2">
            {t("settings.dataStorage.deleteModal.warningBody")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">
            {t("settings.dataStorage.deleteModal.typeDeleteLabel")}
          </label>
          <Input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t("settings.dataStorage.deleteModal.typeDeletePlaceholder")}
            disabled={isProcessing}
            className="text-red-400"
          />
          <p className="mt-1 text-xs text-[var(--text-3)]">
            {t("settings.dataStorage.deleteModal.demoNotice")}
          </p>
        </div>

        <div className="border-t border-[var(--border-default)] pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            {t("settings.dataStorage.deleteModal.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isProcessing}
          >
            {isProcessing
              ? t("settings.dataStorage.deleteModal.processing")
              : t("settings.dataStorage.deleteModal.deleteBtn")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
