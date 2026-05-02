export interface IntegrationConfig {
  tenantId: string;
}

export type CreateJobFolderTreeInput = {
  tenantId: string;
  jobId: string;
  company: string;
  position: string;
};

export type RouteFileToFolderInput = {
  tenantId: string;
  jobId: string;
  documentId: string;
  sourceFileId?: string;
  fileName: string;
  targetFolderId: string;
};

export type ExportDocumentToPdfInput = {
  tenantId: string;
  documentId: string;
  fileName: string;
  contentText?: string;
};
