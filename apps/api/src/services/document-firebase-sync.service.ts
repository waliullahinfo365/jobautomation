import { DocumentModel } from "@jobflow/database/models";
import {
  firebaseStorageEnabled,
  uploadBufferToFirebase,
} from "./firebase-storage.service";

function decodeMaybeBase64(raw: string): Buffer {
  const cleaned = raw.replace(/^data:[^;]+;base64,/, "").trim();
  return Buffer.from(cleaned, "base64");
}

/**
 * Persist original file bytes (or contentText as .txt) to Firebase Storage.
 * Safe no-op when Firebase env is not configured.
 */
export async function syncDocumentToFirebase(input: {
  tenantId: string;
  userId: string;
  documentId: string;
  fileName: string;
  contentText?: string;
  fileBase64?: string;
  mimeType?: string;
  jobId?: string;
}): Promise<{ uploaded: boolean; reason?: string }> {
  if (!firebaseStorageEnabled()) {
    return { uploaded: false, reason: "Firebase not configured" };
  }

  const fileName = input.fileName.trim() || "document.txt";
  let buffer: Buffer;
  let contentType: string;
  let uploadName = fileName;

  if (input.fileBase64?.trim()) {
    buffer = decodeMaybeBase64(input.fileBase64);
    contentType = input.mimeType?.trim() || "application/octet-stream";
  } else if (input.contentText?.trim()) {
    buffer = Buffer.from(input.contentText, "utf8");
    contentType = "text/plain; charset=utf-8";
    uploadName = fileName.toLowerCase().endsWith(".txt") ? fileName : `${fileName.replace(/\.[^.]+$/, "") || fileName}.txt`;
  } else {
    return { uploaded: false, reason: "No file or text content" };
  }

  const uploaded = await uploadBufferToFirebase({
    tenantId: input.tenantId,
    userId: input.userId,
    documentId: input.documentId,
    fileName: uploadName,
    buffer,
    contentType,
    jobId: input.jobId,
  });

  await DocumentModel.findByIdAndUpdate(input.documentId, {
    storageProvider: uploaded.storageProvider,
    storagePath: uploaded.storagePath,
    storageLocation: uploaded.storageLocation,
    storageUrl: uploaded.storagePath,
    "metadata.firebase": {
      bucket: uploaded.bucket,
      contentType: uploaded.contentType,
      sizeBytes: uploaded.sizeBytes,
      uploadedAt: new Date().toISOString(),
    },
  });

  return { uploaded: true };
}
