"use client";

import {
  AlertTriangleIcon,
  BookOpenTextIcon,
  FileBadge2Icon,
  FileOutputIcon,
  FileTextIcon,
  FilesIcon,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/useTranslation";

export function DocumentStatsCards({
  stats,
}: {
  stats: {
    totalDocuments: number;
    cvVersions: number;
    coverLetters: number;
    researchDocs: number;
    pdfExports: number;
    failedExports: number;
  };
}) {
  const { t } = useTranslation();

  const items = [
    { label: t("documents.stats.totalDocuments"), value: stats.totalDocuments, helper: t("documents.stats.acrossAllDocumentTypes"), icon: <FilesIcon size={20} /> },
    { label: t("documents.stats.cvVersions"), value: stats.cvVersions, helper: t("documents.stats.roleSpecificCvLibrary"), icon: <FileBadge2Icon size={20} /> },
    { label: t("documents.stats.coverLetters"), value: stats.coverLetters, helper: t("documents.stats.tailoredRoleDrafts"), icon: <FileTextIcon size={20} /> },
    { label: t("documents.stats.researchDocs"), value: stats.researchDocs, helper: t("documents.stats.companyResearchFiles"), icon: <BookOpenTextIcon size={20} /> },
    { label: t("documents.stats.pdfExports"), value: stats.pdfExports, helper: t("documents.stats.exportAutomationOutput"), icon: <FileOutputIcon size={20} /> },
    { label: t("documents.stats.failedExports"), value: stats.failedExports, helper: t("documents.stats.needsRetryReview"), icon: <AlertTriangleIcon size={20} /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--text-3)]">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text-1)]">{item.value}</p>
                <p className="mt-1 text-xs text-[var(--text-3)]">{item.helper}</p>
              </div>
              <div className="rounded-lg bg-[var(--accent-bg)] p-2.5 text-[var(--accent-hi)]">{item.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
