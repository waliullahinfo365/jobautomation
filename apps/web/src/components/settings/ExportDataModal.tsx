"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { buildWorkspaceExport, type WorkspaceExportType } from "@/lib/export/workspace-export";
import { ApiError } from "@/lib/api/client";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDataModal({
  isOpen,
  onClose,
}: ExportDataModalProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<WorkspaceExportType>("jobs");
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerateExport = async () => {
    setIsExporting(true);
    try {
      const exportData = await buildWorkspaceExport(selectedType);
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `export-${selectedType}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(t("settings.dataStorage.exportModal.successMsg"));
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("settings.dataStorage.exportModal.errorMsg");
      showError(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("settings.dataStorage.exportModal.title")}
      description={t("settings.dataStorage.exportModal.description")}
      size="md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-2)] mb-3">
            {t("settings.dataStorage.exportModal.exportType")}
          </label>

          {(["jobs", "applications", "contacts", "documents", "full"] as const).map((type) => (
            <label key={type} className="flex items-center gap-3 p-3 border border-[var(--border-default)] rounded-lg cursor-pointer hover:bg-[var(--surface-3)] transition-colors">
              <input
                type="radio"
                name="exportType"
                value={type}
                checked={selectedType === type}
                onChange={() => setSelectedType(type)}
                className="cursor-pointer"
              />
              <span className="text-sm text-[var(--text-2)] capitalize font-medium">{type.replace("_", " ")}</span>
            </label>
          ))}
        </div>

        <div className="bg-[var(--surface-3)] rounded-lg p-3 text-xs text-[var(--text-3)]">
          <p>
            {selectedType === "full"
              ? t("settings.dataStorage.exportModal.fullExportDesc")
              : t("settings.dataStorage.exportModal.partialExportDesc").replace("{{type}}", selectedType)}
          </p>
        </div>

        <div className="border-t border-[var(--border-default)] pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            {t("settings.dataStorage.exportModal.cancel")}
          </Button>
          <Button onClick={handleGenerateExport} disabled={isExporting}>
            {isExporting
              ? t("settings.dataStorage.exportModal.generating")
              : t("settings.dataStorage.exportModal.generate")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
