import { GOOGLE_DRIVE_DOCS_WORKER_SCOPES } from "@jobflow/shared/constants/googleScopes";
import { loadGoogleAccessToken } from "./google-auth.service";

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet";
const GOOGLE_SLIDES_MIME = "application/vnd.google-apps.presentation";

type DriveFileMeta = {
  id: string;
  name?: string;
  mimeType?: string;
  size?: string;
};

export type ExportedDriveFile = {
  buffer: Buffer;
  contentType: string;
  fileName: string;
  sizeBytes: number;
  exportBranch: "files.export" | "alt=media";
  sourceMimeType: string;
};

function sanitizeFileName(name: string, fallback: string): string {
  const base = (name.trim() || fallback).replace(/[/\\?%*:|"<>]/g, "-");
  return base.slice(0, 180);
}

function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return ".xlsx";
    default:
      return "";
  }
}

async function fetchDriveBinary(url: string, accessToken: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive download failed (${response.status}): ${text.slice(0, 220)}`);
  }
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length === 0) {
    throw new Error("Drive returned empty file body");
  }
  return { buffer, contentType };
}

async function getDriveFileMeta(fileId: string, accessToken: string): Promise<DriveFileMeta> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size`,
    { headers: { authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive metadata failed (${response.status}): ${text.slice(0, 220)}`);
  }
  return (await response.json()) as DriveFileMeta;
}

/** Stream a Drive file as bytes — Google Docs via files.export, native files via alt=media. */
export async function exportDriveFile(input: {
  tenantId: string;
  googleDriveFileId: string;
  preferredFileName?: string;
  exportMimeType?: string;
}): Promise<ExportedDriveFile> {
  const auth = await loadGoogleAccessToken({
    tenantId: input.tenantId,
    provider: "Google Drive",
    requiredScopes: [...GOOGLE_DRIVE_DOCS_WORKER_SCOPES],
  });
  if (!auth.connected || !auth.accessToken) {
    throw new Error(auth.reason ?? "Google Drive not connected");
  }

  const meta = await getDriveFileMeta(input.googleDriveFileId, auth.accessToken);
  const mimeType = meta.mimeType ?? "application/octet-stream";
  const baseName = sanitizeFileName(input.preferredFileName ?? meta.name ?? "document", "document");

  if (mimeType === GOOGLE_DOC_MIME) {
    const exportMime = input.exportMimeType ?? "application/pdf";
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.googleDriveFileId)}/export?mimeType=${encodeURIComponent(exportMime)}`;
    const { buffer, contentType } = await fetchDriveBinary(url, auth.accessToken);
    const ext = extensionForMime(exportMime);
    const fileName = baseName.endsWith(ext) ? baseName : `${baseName}${ext}`;
    return { buffer, contentType, fileName, sizeBytes: buffer.length, exportBranch: "files.export", sourceMimeType: mimeType };
  }

  if (mimeType === GOOGLE_SHEET_MIME) {
    const exportMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.googleDriveFileId)}/export?mimeType=${encodeURIComponent(exportMime)}`;
    const { buffer, contentType } = await fetchDriveBinary(url, auth.accessToken);
    return { buffer, contentType, fileName: `${baseName}.xlsx`, sizeBytes: buffer.length, exportBranch: "files.export", sourceMimeType: mimeType };
  }

  if (mimeType === GOOGLE_SLIDES_MIME) {
    const exportMime = "application/pdf";
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.googleDriveFileId)}/export?mimeType=${encodeURIComponent(exportMime)}`;
    const { buffer, contentType } = await fetchDriveBinary(url, auth.accessToken);
    return { buffer, contentType, fileName: `${baseName}.pdf`, sizeBytes: buffer.length, exportBranch: "files.export", sourceMimeType: mimeType };
  }

  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.googleDriveFileId)}?alt=media`;
  const { buffer, contentType } = await fetchDriveBinary(url, auth.accessToken);
  return { buffer, contentType, fileName: baseName, sizeBytes: buffer.length, exportBranch: "alt=media", sourceMimeType: mimeType };
}
