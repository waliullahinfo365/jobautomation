"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DocumentsIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { useAdvancedUi } from "@/context/AuthSessionContext";
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
import { mockFolderAutomationSettings } from "@/data/mockDocuments";
import { apiFetch, withQuery, ApiError } from "@/lib/api/client";
import type { DocumentFilterState } from "./DocumentFilters";
import { DocumentsAdvancedView } from "./DocumentsAdvancedView";
import { DocumentsSimpleView } from "./DocumentsSimpleView";
import { UploadDocumentModal, type UploadPayload } from "./UploadDocumentModal";
import { useDocumentsApi } from "@/hooks/api/useDocumentsApi";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { getResourceId, normalizeDocumentRecordsForUi, normalizeJobForUi } from "@/lib/utils/resource";
import { CustomerListPageSkeleton } from "@/components/shared/CustomerPageSkeletons";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
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
    jobId: d.jobId,
    status: d.status,
    aiGenerated: false,
    pdfExportStatus: d.pdfExportStatus ?? "Pending",
    lastUpdated: d.lastUpdated,
    contentText: d.contentText,
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
    contentText: d.contentText,
    jobId: d.jobId,
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
    contentText: d.contentText,
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

function uploadTypeForRecord(record: DocumentRecord): UploadPayload["type"] {
  if (record.type === "CV") return "CV";
  if (record.type === "Cover Letter Template") return "Cover Letter Template";
  if (record.type === "Cover Letter") return "Cover Letter";
  if (record.type === "Research Document") return "Research";
  return "Supporting Document";
}

export function DocumentsPageClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const advancedUi = useAdvancedUi();
  const documentsApi = useDocumentsApi({ fallbackToMock: false });
  const jobsApi = useJobsApi({ fallbackToMock: false });

  const [tab, setTab] = useState<DocumentTab>("All Documents");
  const [filters, setFilters] = useState<DocumentFilterState>(initialFilters);
  const [folderSettings, setFolderSettings] = useState<FolderAutomationSettings>(mockFolderAutomationSettings);
  const [folderActivity, setFolderActivity] = useState<FolderActivityRecord[]>([]);
  const [fallbackEdits, setFallbackEdits] = useState<Record<string, Partial<DocumentRecord>>>({});
  const [localNewDocuments, setLocalNewDocuments] = useState<DocumentRecord[]>([]);
  const [cvDefaultId, setCvDefaultId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInitialType, setUploadInitialType] = useState<UploadPayload["type"]>("CV");

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

  useEffect(() => {
    if (!advancedUi || tab !== "Folder Automation") return;
    apiFetch<{ data?: unknown[] } | unknown[]>(withQuery("/automation/logs", { moduleKey: "folder-automation", limit: "20" }))
      .then((res) => {
        const rows = Array.isArray(res) ? res : (Array.isArray((res as any).data) ? (res as any).data : []);
        setFolderActivity(
          rows.map((r: any, i: number) => ({
            id: String(r._id ?? r.id ?? i),
            time: String(r.createdAt ?? r.timestamp ?? ""),
            job: String(r.metadata?.jobId ? `Job ${String(r.metadata.jobId).slice(-6)}` : (r.relatedRecordId ? `Job ${String(r.relatedRecordId).slice(-6)}` : "Workspace")),
            action: String(r.message ?? ""),
            folderPath: String(r.metadata?.folderPath ?? r.metadata?.jobFolderUrl ?? ""),
            status: String(r.status ?? "Success") as "Success" | "Failed" | "Warning",
          }))
        );
      })
      .catch(() => {/* leave previous state */});
  }, [tab, advancedUi]);

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

  const activeCv = useMemo(
    () => documents.find((d) => d.profileDocumentType === "cv_resume" && d.isActiveProfileDocument) ?? documents.find((d) => d.type === "CV"),
    [documents],
  );
  const activeTemplate = useMemo(
    () =>
      documents.find((d) => d.profileDocumentType === "cover_letter_template" && d.isActiveProfileDocument) ??
      documents.find((d) => d.type === "Cover Letter Template"),
    [documents],
  );

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
        showInfo(t("documents.toast.offlineDemo"));
        showSuccess(t("documents.toast.pdfExportRecorded"));
        return;
      }
      try {
        const result = await documentsApi.exportPdf({ id, execute: false });
        toastQueuedPayload("PDF export", result);
        await documentsApi.refetch();
      } catch {
        showError(t("documents.toast.pdfExportFailed"));
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleRouteCv = async (record: DocumentRecord) => {
    const id = getResourceId(record);
    const jobId = resolveJobIdForDoc(record);
    if (!jobId) {
      showError(t("documents.toast.selectRelatedJob"));
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
        showInfo(t("documents.toast.offlineDemo"));
        showSuccess(t("documents.toast.cvRouted"));
        return;
      }
      try {
        const result = await documentsApi.routeCv({ id, payload: { jobId } });
        toastQueuedPayload("CV routing", result);
        await documentsApi.refetch();
      } catch {
        showError(t("documents.toast.cvRoutingFailed"));
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleOpenDocument = useCallback((record: DocumentRecord) => {
    const url = record.pdfUrl || record.storageUrl || record.driveFileLink;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (advancedUi) {
      showInfo(t("documents.toast.openFolderNote"));
      return;
    }
    showInfo(t("documents.simple.openUnavailable"));
  }, [advancedUi, t]);

  const handleOpenFolder = (record: DocumentRecord) => {
    handleOpenDocument(record);
  };

  const handleSetActive = async (record: DocumentRecord) => {
    const id = getResourceId(record);
    const profileDocumentType =
      record.profileDocumentType ||
      (record.type === "CV" ? "cv_resume" : record.type === "Cover Letter Template" ? "cover_letter_template" : undefined);
    if (!profileDocumentType) return;
    setPendingAction(`active-${id}`);
    try {
      if (documentsApi.isUsingFallback) {
        setFallbackEdits((prev) => {
          const next = { ...prev };
          for (const doc of documents) {
            if (
              doc.profileDocumentType === profileDocumentType ||
              (profileDocumentType === "cv_resume" && doc.type === "CV") ||
              (profileDocumentType === "cover_letter_template" && doc.type === "Cover Letter Template")
            ) {
              next[doc.id] = { ...next[doc.id], isActiveProfileDocument: false };
            }
          }
          next[id] = { ...next[id], isActiveProfileDocument: true, profileDocumentType };
          return next;
        });
        showSuccess(t("documents.toast.documentRecordCreated"));
        return;
      }
      await documentsApi.updateDocument({ id, payload: { isActiveProfileDocument: true, profileDocumentType } });
      await documentsApi.refetch();
      showSuccess(t("documents.toast.documentRecordCreated"));
    } catch {
      showError(t("documents.toast.couldNotCreateRecord"));
    } finally {
      setPendingAction(null);
    }
  };

  const handleProvisionFolder = async () => {
    const jobId = firstJobId;
    if (!jobId) {
      showError(t("documents.toast.noJobForProvision"));
      return;
    }
    setPendingAction("provision");
    try {
      if (jobsApi.isUsingFallback) {
        showInfo(t("documents.toast.offlineDemo"));
        showSuccess(t("documents.toast.folderProvisionQueued"));
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
        showError(t("documents.toast.folderProvisionFailed"));
      }
    } finally {
      setPendingAction(null);
    }
  };

  async function handleCreateDocumentRecord(payload: UploadPayload) {
    const docTypeMap: Record<string, string> = {
      CV: "cv_resume",
      "Cover Letter": "Cover Letter",
      "Cover Letter Template": "cover_letter_template",
      Research: "Research",
      "Supporting Document": "supporting_document",
      Portfolio: "supporting_document",
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
          type:
            payload.type === "Research"
              ? "Research Document"
              : payload.type === "Cover Letter Template"
                ? "Cover Letter Template"
                : payload.type === "Supporting Document" || payload.type === "Portfolio"
                  ? "Supporting Document"
                  : payload.type === "Other"
                    ? "Email Template"
                    : (payload.type as DocumentRecord["type"]),
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
      showInfo(t("documents.toast.offlineDemo"));
      showSuccess(advancedUi ? t("documents.toast.documentRecordCreated") : t("documents.simple.uploadSuccess"));
      setUploadOpen(false);
      return;
    }
    try {
      const ids = getTenantUserIdsForApi();
      const apiType = docTypeMap[payload.type] ?? "Other";
      const profileDocumentType =
        apiType === "cv_resume" || apiType === "cover_letter_template" || apiType === "supporting_document"
          ? apiType
          : undefined;
      const jobIdClean = typeof payload.jobId === "string" && payload.jobId.trim() ? payload.jobId.trim() : undefined;
      await documentsApi.createDocument({
        ...ids,
        fileName: payload.fileName,
        type: apiType,
        documentKind: apiType === "cv_resume" ? "CV" : apiType === "cover_letter_template" ? "Cover Letter" : "Other",
        status: "Draft",
        jobId: jobIdClean,
        contentText: payload.contentText,
        notes: payload.notes,
        fileBase64: payload.fileBase64,
        mimeType: payload.mimeType,
        profileDocumentType,
        sourceFileName: payload.fileName,
        metadata: !jobIdClean ? { workspaceLibrary: true, profileDocumentType } : undefined,
      });
      showSuccess(advancedUi ? t("documents.toast.documentRecordCreated") : t("documents.simple.uploadSuccess"));
      setUploadOpen(false);
      await documentsApi.refetch();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("documents.toast.couldNotCreateRecord");
      showError(msg);
    }
  }

  const openUpload = useCallback((type: UploadPayload["type"]) => {
    setUploadInitialType(type);
    setUploadOpen(true);
  }, []);

  useEffect(() => {
    const upload = searchParams.get("upload");
    if (upload === "cv") openUpload("CV");
    else if (upload === "cover" || upload === "cover_letter_template") openUpload("Cover Letter Template");
  }, [searchParams, openUpload]);

  const handleSimpleReplace = useCallback(
    (record: DocumentRecord) => {
      openUpload(uploadTypeForRecord(record));
    },
    [openUpload]
  );

  const isInitialLoading = documentsApi.loading && documentsApi.data === undefined;

  if (isInitialLoading) {
    if (!advancedUi) {
      return <CustomerListPageSkeleton withTabs />;
    }
    return (
      <div className="space-y-6">
        <PageHeader
          icon={DocumentsIcon}
          eyebrow={advancedUi ? t("documents.eyebrow") : undefined}
          title={advancedUi ? t("documents.title") : t("documents.simple.title")}
          description={advancedUi ? t("documents.description") : t("documents.simple.subtitle")}
        />
        <LoadingState title={t("documents.loadingTitle")} description={t("documents.loadingDesc")} />
      </div>
    );
  }

  if (documentsApi.error && !documentsApi.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={DocumentsIcon}
          eyebrow={advancedUi ? t("documents.eyebrow") : undefined}
          title={advancedUi ? t("documents.title") : t("documents.simple.title")}
          description={advancedUi ? t("documents.description") : t("documents.simple.subtitle")}
        />
        <ErrorState
          title={t("documents.loadingTitle")}
          description={documentsApi.error.message}
          actionLabel={t("common.retry")}
          onAction={() => void documentsApi.refetch()}
        />
      </div>
    );
  }

  if (advancedUi) {
    return (
      <DocumentsAdvancedView
        tab={tab}
        onTabChange={setTab}
        filters={filters}
        onFiltersChange={setFilters}
        onFiltersClear={() => setFilters(initialFilters)}
        stats={stats}
        documents={documents}
        filteredAllDocuments={filteredAllDocuments}
        activeCv={activeCv}
        activeTemplate={activeTemplate}
        cvRows={cvRows}
        coverRows={coverRows}
        researchRows={researchRows}
        pdfRows={pdfRows}
        folderActivity={folderActivity}
        folderSettings={folderSettings}
        onFolderSettingsChange={setFolderSettings}
        isUsingFallback={documentsApi.isUsingFallback}
        uploadOpen={uploadOpen}
        onUploadOpenChange={setUploadOpen}
        onCreateDocument={handleCreateDocumentRecord}
        createLoading={documentsApi.mutations.createLoading}
        onExportPdf={(r) => void handleExportPdf(r)}
        onRouteCv={(r) => void handleRouteCv(r)}
        onOpenFolder={handleOpenFolder}
        onSetActive={(r) => void handleSetActive(r)}
        onProvisionFolder={() => void handleProvisionFolder()}
        provisionDisabled={!!pendingAction || !firstJobId}
        onCvSetDefault={(id) => setCvDefaultId(id)}
        onCvView={(cv) => {
          const doc = documents.find((d) => d.id === cv.id);
          const url = doc?.pdfUrl || doc?.storageUrl;
          if (url) window.open(url, "_blank", "noopener,noreferrer");
          else showInfo("No file URL available for this CV.");
        }}
        onPdfExportAgain={(r) => {
          const doc = documents.find((d) => d.id === r.id);
          if (doc) void handleExportPdf(doc);
        }}
      />
    );
  }

  return (
    <>
      <DocumentsSimpleView
        documents={documents}
        activeCv={activeCv}
        activeTemplate={activeTemplate}
        onOpen={handleOpenDocument}
        onReplace={handleSimpleReplace}
        onUpload={openUpload}
      />
      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleCreateDocumentRecord}
        loading={documentsApi.mutations.createLoading}
        variant="simple"
        initialType={uploadInitialType}
      />
    </>
  );
}
