import { env } from "@/config/env";
import { ApiError, apiFetch, getAuthToken, invalidateApiCache } from "./client";

export type ApplyCompleteStatus = "Applied" | "In Progress" | "Rejected" | "Interview";

export type CoverLetterSource = "generated" | "template" | "legacy_template" | null;

export type ApplyDocumentStatus = {
  cv: { available: boolean; documentId?: string; fileName?: string; googleDriveFileId?: string };
  coverLetter: {
    available: boolean;
    documentId?: string;
    fileName?: string;
    googleDriveFileId?: string;
    source?: CoverLetterSource;
    generatedCoverLetterDocumentId?: string | null;
  };
  missingDocuments: { cv: boolean; coverLetter: boolean };
};

export type ApplyCompletePayload = {
  status: ApplyCompleteStatus;
  notes?: string;
  followUpDate?: string;
  proofDocumentId?: string;
  documentIds?: string[];
};

export type GenerateAnswerResponse = {
  answer: string;
  aiGenerated: boolean;
};

export function getApplyDocumentStatus(jobId: string) {
  return apiFetch<ApplyDocumentStatus>(`/jobs/${jobId}/apply/documents/status`);
}

export async function fetchApplyDocumentBlob(
  jobId: string,
  role: "cv" | "cover_letter"
): Promise<{ blob: Blob; contentType: string; fileName: string }> {
  const token = getAuthToken();
  const response = await fetch(`${env.api.url}/jobs/${jobId}/apply/documents/${role}/stream`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try {
      const parsed = (await response.json()) as { error?: string | { message?: string } };
      const err = parsed.error;
      message = typeof err === "string" ? err : err?.message ?? message;
    } catch {
      const text = await response.text();
      if (text) message = text.slice(0, 200);
    }
    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new ApiError("Drive returned an empty file", 502);
  }

  const contentType = response.headers.get("content-type") ?? blob.type ?? "application/octet-stream";
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(disposition);
  const fileName = match?.[1] ? decodeURIComponent(match[1]) : role === "cv" ? "cv.pdf" : "cover-letter.pdf";

  return { blob, contentType, fileName };
}

export async function generateApplyAnswer(jobId: string, questionText: string) {
  const token = getAuthToken();
  const response = await fetch(`${env.api.url}/jobs/${jobId}/apply/generate-answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ questionText }),
    cache: "no-store",
  });
  const parsed = (await response.json()) as { success?: boolean; data?: GenerateAnswerResponse; error?: string | { message?: string } };
  if (!response.ok || !parsed.success) {
    const err = parsed.error;
    throw new ApiError(typeof err === "string" ? err : err?.message ?? "Generate answer failed", response.status);
  }
  return parsed.data as GenerateAnswerResponse;
}

export async function completeApplyAssistant(jobId: string, payload: ApplyCompletePayload) {
  const token = getAuthToken();
  const response = await fetch(`${env.api.url}/jobs/${jobId}/apply/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const parsed = (await response.json()) as { success?: boolean; data?: unknown; error?: string | { message?: string } };
  if (!response.ok || !parsed.success) {
    const err = parsed.error;
    throw new ApiError(typeof err === "string" ? err : err?.message ?? "Complete apply failed", response.status);
  }
  invalidateApiCache("/jobs");
  invalidateApiCache("/applications");
  return parsed.data;
}

export async function downloadApplyDocument(jobId: string, role: "cv" | "cover_letter") {
  const { blob, fileName } = await fetchApplyDocumentBlob(jobId, role);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function shareApplyDocument(jobId: string, role: "cv" | "cover_letter") {
  const { blob, fileName } = await fetchApplyDocumentBlob(jobId, role);
  const file = new File([blob], fileName, { type: blob.type || "application/octet-stream" });
  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: fileName });
    return;
  }
  await downloadApplyDocument(jobId, role);
}
