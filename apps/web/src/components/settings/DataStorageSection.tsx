"use client";

import { useState } from "react";
import { SettingSectionCard } from "./SettingSectionCard";
import { Button } from "@/components/ui/button";
import { ExportDataModal } from "./ExportDataModal";
import { DeleteWorkspaceConfirmModal } from "./DeleteWorkspaceConfirmModal";
import { useTranslation } from "@/i18n/useTranslation";

export function DataStorageSection() {
  const { t } = useTranslation();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <SettingSectionCard
        title={t("settings.dataStorage.title")}
        description={t("settings.dataStorage.description")}
      >
        <div className="space-y-2 text-sm">
          <Field
            label={t("settings.dataStorage.database")}
            value={t("settings.dataStorage.databaseValue")}
          />
          <Field
            label={t("settings.dataStorage.fileStorage")}
            value={t("settings.dataStorage.fileStorageValue")}
          />
          <Field
            label={t("settings.dataStorage.pdfExportsFolder")}
            value={t("settings.dataStorage.pdfExportsFolderValue")}
          />
          <Field
            label={t("settings.dataStorage.dataRetention")}
            value={t("settings.dataStorage.dataRetentionValue")}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsExportOpen(true)}>
            {t("settings.dataStorage.exportData")}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            {t("settings.dataStorage.deleteWorkspace")}
          </Button>
        </div>
      </SettingSectionCard>

      <ExportDataModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <DeleteWorkspaceConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} />
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
