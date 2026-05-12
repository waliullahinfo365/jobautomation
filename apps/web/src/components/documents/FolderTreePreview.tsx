"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderTreeIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";

export function FolderTreePreview() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderTreeIcon size={16} />
          {t("documents.folderTree.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-[var(--text-2)]">
        <p>{t("documents.folderTree.jobApplications")}</p>
        <p className="ml-4">- {t("documents.folderTree.companyFolder")}</p>
        <p className="ml-8">- {t("documents.folderTree.jobRoleSubfolder")}</p>
        <p className="ml-12">- {t("documents.folderTree.cv")}</p>
        <p className="ml-12">- {t("documents.folderTree.coverLetter")}</p>
        <p className="ml-12">- {t("documents.folderTree.research")}</p>
        <p className="ml-12">- {t("documents.folderTree.exports")}</p>
      </CardContent>
    </Card>
  );
}
