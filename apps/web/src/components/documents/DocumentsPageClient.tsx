"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentsIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { PageHeader } from "@/components/shared/PageHeader";
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
import {
  mockFolderActivity,
  mockFolderAutomationSettings,
} from "@/data/mockDocuments";
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
import { useDocumentsApi } from "@/hooks/api/useDocumentsApi";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { getResourceId, normalizeDocumentRecordsForUi, normalizeJobForUi } from "@/lib/utils/resource";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import type { Job } from "@/types/job";
import { getTenantUserIdsForApi } from "@/lib/api/jobs.api";
import { API_URL } from "@/config/env";
import { isPublicFileUrl } from "@/lib/utils/is-public-file-url";

const initialFilters: DocumentFilterState = {
  query: "",
  type: "All",
  status: "All",
  relatedJob: "All Jobs",
};

function toCoverLetterRecord(d: DocumentRecord): CoverLetterRecord {
  return {
    id: d.id,
    fileName: d.fileName,
    company: d.company,
    position: d.position,
    relatedJob: d.relatedJob,
    status: d.status,
    aiGenerated: false,
    pdfExportStatus: d.pdfExportStatus ?? "Pending",
    lastUpdated: d.lastUpdated,
  };
}

function toResearchRecord(d: DocumentRecord): ResearchDocumentRecord {
  return {
    id: d.id,
    documentName: d.fileName,
    company: d.company,
    position: d.position,
    researchStatus: d.status,
    aiSummarySnippet: "—",
    createdAt: d.lastUpdated,
  };
}

function toPdfExportRecord(d: DocumentRecord): PDFExportRecord {
  const exportPublicUrl =
    (d.pdfUrl && isPublicFileUrl(d.pdfUrl, API_URL) ? d.pdfUrl : "") ||
    (d.storageUrl && isPublicFileUrl(d.storageUrl, API_URL) ? d.storageUrl : "") ||
    "";
  const textPreviewAvailable = d.pdfExportStatus === "Preview Only";
  return {
    id: d.id,
    documentName: d.fileName,
    sourceType: d.type,
    relatedJob: d.relatedJob,
    exportStatus: d.pdfExportStatus ?? "Pending",
    createdAt: d.lastUpdated,
    exportPublicUrl,
    textPreviewAvailable,
    pdfLink: exportPublicUrl,
  };
}

function toCVVersion(d: DocumentRecord, index: number, defaultId: string | null): CVVersion {
  return {
    id: d.id,
    cvName: d.fileName,
    targetRole: d.position || "Role",
    industry: "General",
    version: "v1",
    status: d.status,
    usedInApplicationsCount: 0,
    isDefault: defaultId ? d.id === defaultId : index === 0,
    lastUpdated: d.lastUpdated,
  };
}

function toastQueuedPayload(label: string, result: unknown) {
  const r = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
  const parts = [
    r.operationId != null && `operationId: ${String(r.operationId)}`,
    r.jobId != null && `jobId: ${String(r.jobId)}`,
    r.status != null && `status: ${String(r.status)}`,
  ].filter(Boolean);
  showSuccess(parts.length ? `${label}: ${parts.join(" · ")}` : `${label} queued.`);
}

export function DocumentsPageClient() {
  const { t } = useTranslation();
  const documentsApi = useDocumentsApi({ fallbackToMock: true });
  const jobsApi = useJobsApi({ fallbackToMock: true });

  const [tab, setTab] = useState<DocumentTab>("All Documents");
  const [filters, setFilters] = useState<DocumentFilterState>(initialFilters);
  const [folderSettings, setFolderSettings] = useState<FolderAutomationSettings>(mockFolderAutomationSettings);
  const [folderActivity, setFolderActivity] = useState<FolderActivityRecord[]>(mockFolderActivity);
  const [fallbackEdits, setFallbackEdits] = useState<Record<string, Partial<DocumentRecord>>>({});
  const [localNewDocuments, setLocalNewDocuments] = useState<DocumentRecord[]>([]);
  const [cvDefaultId, setCvDefaultId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const baseDocuments = useMemo(() => {
    const raw = normalizeListResponse<unknown>(documentsApi.data);
    return normalizeDocumentRecordsForUi(raw);
  }, [documentsApi.data]);

  const jobs = useMemo((): Job[] => {
    const raw = normalizeListResponse<unknown>(jobsApi.data);
    return raw.map(normalizeJobForUi);
  }, [jobsApi.data]);

  useEffect(() => {
    if (!documentsApi.isUsingFallback) {
      setFallbackEdits({});
      setLocalNewDocuments([]);
    }
  }, [documentsApi.isUsingFallback]);

  const documents = useMemo(() => {
    const patched = baseDocuments.map((doc) => {
      const id = getResourceId(doc);
      const ed = fallbackEdits[id];
      return ed ? ({ ...doc, ...ed } as DocumentRecord) : doc;
    });
    if (!documentsApi.isUsingFallback) return patched;
    return [...localNewDocuments, ...patched];
  }, [baseDocuments, documentsApi.isUsingFallback, fallbackEdits, localNewDocuments]);

  const firstJobId = useMemo(() => (jobs[0] ? getResourceId(jobs[0]) : undefined), [jobs]);

  const stats = useMemo(
    () => ({
      totalDocuments: documents.length,
      cvVersions: documents.filter((d) => d.type === "CV").length,
      coverLetters: documents.filter((d) => d.type === "Cover Letter").length,
      researchDocs: documents.filter((d) => d.type === "Research Document").length,
      pdfExports: documents.filter((d) => d.type === "PDF Export").length,
      failedExports: documents.filter((d) => d.pdfExportStatus === "Failed" || d.status === "Failed").length,
    }),
    [documents]
  );

  const filteredAllDocuments = useMemo(() => {
    return documents.filter((record) => {
      const searchString = `${record.fileName} ${record.company} ${record.position} ${record.type}`.toLowerCase();
      const matchesQuery = !filters.query || searchString.includes(filters.query.toLowerCase());
      const matchesType = filters.type === "All" ? true : record.type === filters.type;
      const matchesStatus = filters.status === "All" ? true : record.status === filters.status;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [documents, filters]);

  const cvRows = useMemo(() => {
    const cvs = documents.filter((d) => d.type === "CV");
    return cvs.map((d, i) => toCVVersion(d, i, cvDefaultId));
  }, [documents, cvDefaultId]);

  const coverRows = useMemo(
    () => documents.filter((d) => d.type === "Cover Letter").map(toCoverLetterRecord),
    [documents]
  );
  const researchRows = useMemo(
    () => documents.filter((d) => d.type === "Research Document").map(toResearchRecord),
    [documents]
  );
  const pdfRows = useMemo(
    () => documents.filter((d) => d.type === "PDF Export").map(toPdfExportRecord),
    [documents]
  );

  const patchFallback = useCallback((id: string, patch: Partial<DocumentRecord>) => {
    setFallbackEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const resolveJobIdForDoc = useCallback(
    (record: DocumentRecord): string | undefined => {
      return record.jobId || firstJobId;
    },
    [firstJobId]
  );

  const handleExportPdf = async (record: DocumentRecord) => {
    const id = getResourceId(record);
    setPendingAction(`pdf-${id}`);
    try {
      if (documentsApi.isUsingFallback) {
        patchFallback(id, {
          pdfExportStatus: "Exported",
          pdfUrl: `https://drive.google.com/file/d/demo_${encodeURIComponent(id)}/view`,
          status: "Exported",
          lastUpdated: new Date().toISOString(),
        });
        showInfo("API offline, updated demo data locally.");
        showSuccess("PDF export recorded (demo).");
        return;
      }
      try {
        const result = await documentsApi.exportPdf({ id, execute: false });
        toastQueuedPayload("PDF export", result);
        await documentsApi.refetch();
      } catch {
        showError("PDF export failed.");
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleRouteCv = async (record: DocumentRecord) => {
    const id = getResourceId(record);
    const jobId = resolveJobIdForDoc(record);
    if (!jobId) {
      showError("Select a related job first.");
      return;
    }
    setPendingAction(`route-${id}`);
    try {
      if (documentsApi.isUsingFallback) {
        patchFallback(id, {
          routingStatus: "Completed",
          storageLocation: `${record.storageLocation} → routed`,
          lastUpdated: new Date().toISOString(),
        });
        showInfo("API offline, updated demo data locally.");
        showSuccess("CV routed (demo).");
        return;
      }
      try {
        const result = await documentsApi.routeCv({ id, payload: { jobId } });
        toastQueuedPayload("CV routing", result);
        await documentsApi.refetch();
      } catch {
        showError("CV routing failed.");
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleOpenFolder = (record: DocumentRecord) => {
    if (record.storageUrl) {
      window.open(record.storageUrl, "_blank", "noopener,noreferrer");
      return;
    }
    showInfo("Open folder will be available after Google Drive storage is connected.");
  };

  const handleProvisionFolder = async () => {
    const jobId = firstJobId;
    if (!jobId) {
      showError("No job available to provision a folder.");
      return;
    }
    setPendingAction("provision");
    try {
      if (jobsApi.isUsingFallback) {
        showInfo("API offline, updated demo data locally.");
        showSuccess("Folder provision queued (demo).");
        setFolderActivity((prev) => [
          {
            id: `fa_local_${Date.now()}`,
            time: new Date().toISOString(),
            job: jobs[0] ? `${jobs[0].company} / ${jobs[0].position}` : "Job",
            action: "Provision folder (demo)",
            folderPath: "Job Applications/…",
            status: "Success",
          },
          ...prev,
        ]);
        return;
      }
      try {
        const result = await jobsApi.provisionFolders({ id: jobId, execute: false });
        toastQueuedPayload("Folder provision", result);
      } catch {
        showError("Folder provision failed.");
      }
    } finally {
      setPendingAction(null);
    }
  };

  async function handleCreateDocumentRecord(payload: UploadPayload) {
    const docTypeMap: Record<string, string> = {
      CV: "CV",
      "Cover Letter": "Cover Letter",
      Research: "Research",
      Portfolio: "Portfolio",
      Other: "Other",
    };
    if (documentsApi.isUsingFallback) {
      const id = `local-doc-${Date.now()}`;
      const job = payload.jobId ? jobs.find((j) => getResourceId(j) === payload.jobId) : undefined;
      setLocalNewDocuments((prev) => [
        {
          id,
          _id: id,
          fileName: payload.fileName,
          type: payload.type === "Research" ? "Research Document" : payload.type === "Other" ? "Email Template" : (payload.type as DocumentRecord["type"]),
          relatedJob: job ? `${job.company} / ${job.position}` : "—",
          company: job?.company ?? "",
          position: job?.position ?? "",
          status: "Draft",
          storageLocation: "Local upload record",
          lastUpdated: new Date().toISOString(),
          jobId: payload.jobId,
        },
        ...prev,
      ]);
      showInfo("API offline, updated demo data locally.");
      showSuccess("Document record created. File storage upload will be connected next.");
      setUploadOpen(false);
      return;
    }
    try {
      const ids = getTenantUserIdsForApi();
      const apiType = docTypeMap[payload.type] ?? "Other";
      await documentsApi.createDocument({
        ...ids,
        fileName: payload.fileName,
        type: apiType,
        documentKind: apiType === "CV" ? "CV" : apiType === "Cover Letter" ? "Cover Letter" : "Other",
        status: "Draft",
        jobId: payload.jobId,
        contentText: payload.contentText,
        notes: payload.notes,
        metadata: !payload.jobId ? { workspaceLibrary: true } : undefined,
      });
      showSuccess("Document record created. File storage upload will be connected next.");
      setUploadOpen(false);
      await documentsApi.refetch();
    } catch {
      showError("Could not create document record.");
    }
  }

  const isInitialLoading = documentsApi.loading && documentsApi.data === undefined;

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={DocumentsIcon}
          eyebrow="Document Vault"
          title="Documents"
          description="Manage CVs, cover letters, research documents, folders, and PDF exports."
          actions={
            <Button type="button" onClick={() => setUploadOpen(true)}>
              Upload Document
            </Button>
          }
        />
        <LoadingState title={t("loading.documents")} description={t("loading.documentsDesc")} />
      </div>
    );
  }

  const emptyAll = documents.length === 0;
  const emptyFiltered = !emptyAll && filteredAllDocuments.length === 0 && tab === "All Documents";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DocumentsIcon}
        eyebrow="Document Vault"
        title="Documents"
        description="Manage CVs, cover letters, research documents, folders, and PDF exports."
        actions={<Button type="button" onClick={() => setUploadOpen(true)}>Upload Document</Button>}
      />

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleCreateDocumentRecord}
        loading={documentsApi.mutations.createLoading}
      />

      <DocumentStatsCards stats={stats} />
      <DocumentTabs value={tab} onChange={setTab} />

      {tab === "All Documents" ? (
        <div className="space-y-4">
          <DocumentFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(initialFilters)}
            aside={documentsApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
          />
          {emptyAll ? (
            <EmptyState title={t("empty.noDocuments")} description={t("empty.noDocumentsDesc")} />
          ) : emptyFiltered ? (
            <EmptyState
              title={t("empty.noMatchingDocuments")}
              description="Try another filter."
              actionLabel={t("empty.clearFilters")}
              onAction={() => setFilters(initialFilters)}
            />
          ) : (
            <AllDocumentsTable
              records={filteredAllDocuments}
              onExportPdf={(r) => void handleExportPdf(r)}
              onRouteCv={(r) => void handleRouteCv(r)}
              onOpenFolder={(r) => handleOpenFolder(r)}
            />
          )}
        </div>
      ) : null}

      {tab === "CV Library" ? (
        <CVLibrarySection
          records={cvRows}
          onSetDefault={(id) => {
            setCvDefaultId(id);
          }}
        />
      ) : null}
      {tab === "Cover Letters" ? <CoverLettersSection records={coverRows} /> : null}
      {tab === "Research Docs" ? <ResearchDocsSection records={researchRows} /> : null}
      {tab === "PDF Exports" ? <PDFExportsSection records={pdfRows} /> : null}
      {tab === "Folder Automation" ? (
        <FolderAutomationSection
          activity={folderActivity}
          settings={folderSettings}
          onChange={setFolderSettings}
          onProvisionJobFolder={() => void handleProvisionFolder()}
          provisionDisabled={!!pendingAction || !firstJobId}
        />
      ) : null}
    </div>
  );
}
