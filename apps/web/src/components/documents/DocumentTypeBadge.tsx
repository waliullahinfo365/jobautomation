"use client";

import type { DocumentType } from "@/types/document";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";

const TYPE_KEY: Record<DocumentType, string> = {
  CV: "documents.documentType.cv",
  "Cover Letter": "documents.documentType.coverLetter",
  "Cover Letter Template": "documents.documentType.coverLetterTemplate",
  "Research Document": "documents.documentType.researchDocument",
  "Supporting Document": "documents.documentType.supportingDocument",
  "AI Draft": "documents.documentType.aiDraft",
  "Email Template": "documents.documentType.emailTemplate",
  "PDF Export": "documents.documentType.pdfExport",
  "Job Folder": "documents.documentType.jobFolder",
};

export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  const { t } = useTranslation();
  return <Badge variant="default">{t(TYPE_KEY[type] ?? type)}</Badge>;
}
