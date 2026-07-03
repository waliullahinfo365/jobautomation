"use client";

import { Button } from "@/components/ui/button";
import { DocumentsIcon } from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import type {
  CoverLetterRecord,
  CVVersion,
  DocumentRecord,
  DocumentTab,
  FolderActivityRecord,
  FolderAutomationSettings,
  PDFExportRecord,
  ResearchDocumentRecord,
} from "@/types/document";
import { DocumentStatsCards } from "./DocumentStatsCards";
import { DocumentTabs } from "./DocumentTabs";
import { DocumentFilters, type DocumentFilterState } from "./DocumentFilters";
import { AllDocumentsTable } from "./AllDocumentsTable";
import { CVLibrarySection } from "./CVLibrarySection";
import { CoverLettersSection } from "./CoverLettersSection";
import { ResearchDocsSection } from "./ResearchDocsSection";
import { PDFExportsSection } from "./PDFExportsSection";
import { FolderAutomationSection } from "./FolderAutomationSection";
import { UploadDocumentModal, type UploadPayload } from "./UploadDocumentModal";
import { useTranslation } from "@/i18n/useTranslation";

export interface DocumentsAdvancedViewProps {
  tab: DocumentTab;
  onTabChange: (tab: DocumentTab) => void;
  filters: DocumentFilterState;
  onFiltersChange: (filters: DocumentFilterState) => void;
  onFiltersClear: () => void;
  stats: {
    totalDocuments: number;
    cvVersions: number;
    coverLetters: number;
    researchDocs: number;
    pdfExports: number;
    failedExports: number;
  };
  documents: DocumentRecord[];
  filteredAllDocuments: DocumentRecord[];
  activeCv: DocumentRecord | undefined;
  activeTemplate: DocumentRecord | undefined;
  cvRows: CVVersion[];
  coverRows: CoverLetterRecord[];
  researchRows: ResearchDocumentRecord[];
  pdfRows: PDFExportRecord[];
  folderActivity: FolderActivityRecord[];
  folderSettings: FolderAutomationSettings;
  onFolderSettingsChange: (settings: FolderAutomationSettings) => void;
  isUsingFallback: boolean;
  uploadOpen: boolean;
  onUploadOpenChange: (open: boolean) => void;
  onCreateDocument: (payload: UploadPayload) => Promise<void>;
  createLoading: boolean;
  onExportPdf: (record: DocumentRecord) => void;
  onRouteCv: (record: DocumentRecord) => void;
  onOpenFolder: (record: DocumentRecord) => void;
  onSetActive: (record: DocumentRecord) => void;
  onProvisionFolder: () => void;
  provisionDisabled: boolean;
  onCvSetDefault: (id: string) => void;
  onCvView: (cv: CVVersion) => void;
  onPdfExportAgain: (record: PDFExportRecord) => void;
}

export function DocumentsAdvancedView({
  tab,
  onTabChange,
  filters,
  onFiltersChange,
  onFiltersClear,
  stats,
  documents,
  filteredAllDocuments,
  activeCv,
  activeTemplate,
  cvRows,
  coverRows,
  researchRows,
  pdfRows,
  folderActivity,
  folderSettings,
  onFolderSettingsChange,
  isUsingFallback,
  uploadOpen,
  onUploadOpenChange,
  onCreateDocument,
  createLoading,
  onExportPdf,
  onRouteCv,
  onOpenFolder,
  onSetActive,
  onProvisionFolder,
  provisionDisabled,
  onCvSetDefault,
  onCvView,
  onPdfExportAgain,
}: DocumentsAdvancedViewProps) {
  const { t } = useTranslation();

  const emptyAll = documents.length === 0;
  const emptyFiltered = !emptyAll && filteredAllDocuments.length === 0 && tab === "All Documents";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DocumentsIcon}
        eyebrow={t("documents.eyebrow")}
        title={t("documents.title")}
        description={t("documents.description")}
        actions={
          <Button type="button" onClick={() => onUploadOpenChange(true)}>
            {t("documents.actions.uploadDocument")}
          </Button>
        }
      />

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => onUploadOpenChange(false)}
        onSubmit={onCreateDocument}
        loading={createLoading}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--r-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Active CV / Resume</p>
          <p className="mt-2 line-clamp-2 break-all text-sm font-semibold leading-snug text-[var(--text-1)]">
            {activeCv?.fileName ?? "—"}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button size="sm" variant="outline" type="button" className="w-full sm:w-auto" onClick={() => onUploadOpenChange(true)}>
              Upload New Version
            </Button>
            {activeCv ? (
              <Button size="sm" variant="ghost" type="button" className="w-full sm:w-auto" onClick={() => onOpenFolder(activeCv)}>
                Download/Open in Drive
              </Button>
            ) : null}
          </div>
        </div>
        <div className="rounded-[var(--r-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Active Cover Letter Template</p>
          <p className="mt-2 line-clamp-2 break-all text-sm font-semibold leading-snug text-[var(--text-1)]">
            {activeTemplate?.fileName ?? "—"}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button size="sm" variant="outline" type="button" className="w-full sm:w-auto" onClick={() => onUploadOpenChange(true)}>
              Upload New Version
            </Button>
            {activeTemplate ? (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="w-full sm:w-auto"
                onClick={() => onOpenFolder(activeTemplate)}
              >
                Download/Open in Drive
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <DocumentStatsCards stats={stats} />
      <DocumentTabs value={tab} onChange={onTabChange} />

      {tab === "All Documents" ? (
        <div className="space-y-4">
          <DocumentFilters
            filters={filters}
            onChange={onFiltersChange}
            onClear={onFiltersClear}
            aside={isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
          />
          {emptyAll ? (
            <EmptyState title={t("documents.empty.noDocuments")} description={t("documents.empty.noDocumentsDesc")} />
          ) : emptyFiltered ? (
            <EmptyState
              title={t("documents.empty.noMatching")}
              description={t("documents.empty.noMatchingDesc")}
              actionLabel={t("documents.filters.clear")}
              onAction={onFiltersClear}
            />
          ) : (
            <AllDocumentsTable
              records={filteredAllDocuments}
              onExportPdf={onExportPdf}
              onRouteCv={onRouteCv}
              onOpenFolder={onOpenFolder}
              onSetActive={onSetActive}
            />
          )}
        </div>
      ) : null}

      {tab === "CV Library" ? (
        <CVLibrarySection records={cvRows} onSetDefault={onCvSetDefault} onView={onCvView} />
      ) : null}
      {tab === "Cover Letters" ? <CoverLettersSection records={coverRows} /> : null}
      {tab === "Research Docs" ? <ResearchDocsSection records={researchRows} /> : null}
      {tab === "PDF Exports" ? <PDFExportsSection records={pdfRows} onExportAgain={onPdfExportAgain} /> : null}
      {tab === "Folder Automation" ? (
        <FolderAutomationSection
          activity={folderActivity}
          settings={folderSettings}
          onChange={onFolderSettingsChange}
          onProvisionJobFolder={onProvisionFolder}
          provisionDisabled={provisionDisabled}
        />
      ) : null}
    </div>
  );
}
