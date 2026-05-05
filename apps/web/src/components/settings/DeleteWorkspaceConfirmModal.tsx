"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showInfo, showError } from "@/lib/ui/toast";

interface DeleteWorkspaceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteWorkspaceConfirmModal({
  isOpen,
  onClose,
}: DeleteWorkspaceConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isConfirmed = confirmText.toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed) {
      showError("Please type DELETE to confirm.");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate delete operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      showInfo("Workspace deletion is disabled in this demo environment.");
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
      title="Delete Workspace"
      description="This action cannot be undone"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4">
          <p className="text-sm text-red-200 font-medium">⚠️ Warning</p>
          <p className="text-sm text-[var(--text-2)] mt-2">
            This will permanently delete the workspace and all associated data including jobs, applications, contacts,
            documents, and all automation settings. This action cannot be reversed.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">
            Type DELETE to confirm
          </label>
          <Input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            disabled={isProcessing}
            className="text-red-400"
          />
          <p className="mt-1 text-xs text-[var(--text-3)]">
            This is a demo environment. Workspace deletion is disabled.
          </p>
        </div>

        <div className="border-t border-[var(--border-default)] pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isProcessing}
          >
            {isProcessing ? "Processing..." : "Delete Workspace"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
