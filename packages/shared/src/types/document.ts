import type { documentStatuses, documentTypes } from "../constants/statuses";
export type DocumentStatus = (typeof documentStatuses)[number];
export type DocumentType = (typeof documentTypes)[number];
export interface Document { id: string; tenantId: string; createdBy: string; jobId?: string; applicationId?: string; fileName: string; type: DocumentType; status: DocumentStatus; documentKind?: "Research" | "Cover Letter" | "CV" | "PDF Export" | "Other"; contentText?: string; aiProvider?: string; aiModel?: string; promptVersion?: string; generationStatus?: "Pending" | "Generated" | "Failed" | "Needs Review"; generationMetadata?: Record<string, unknown>; checksum?: string; storageProvider?: string; storagePath?: string; storageUrl?: string; googleDriveFileId?: string; googleDriveFolderId?: string; routedToJobFolder?: boolean; routedAt?: string; sourceFileId?: string; targetFolderId?: string; targetPath?: string; routingStatus?: "Not Started" | "Queued" | "Completed" | "Failed"; routingError?: string; pdfExportStatus?: "Not Started" | "Queued" | "Exported" | "Failed"; pdfUrl?: string; pdfExportedAt?: string; pdfExportError?: string; version?: number; aiGenerated?: boolean; metadata?: Record<string, unknown>; createdAt: string; updatedAt: string; }

export interface CvRoutingResult {
  operationId: string;
  tenantId: string;
  documentId: string;
  jobId: string;
  status: "completed" | "existing" | "failed";
  targetPath?: string;
  message: string;
}

export interface PdfExportResult {
  operationId: string;
  tenantId: string;
  documentId: string;
  status: "completed" | "existing" | "failed" | "completed-text";
  pdfUrl?: string;
  message: string;
}
