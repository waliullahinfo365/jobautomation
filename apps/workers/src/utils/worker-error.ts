import type { AutomationJobPayload } from "@jobflow/shared/types/queue";

/** Strip patterns that could contain secrets before persisting or returning in metadata. */
export function redactForLog(text: string, maxLen = 800): string {
  let s = text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  s = s.replace(/sk-ant-[a-zA-Z0-9_-]{8,}/gi, "[redacted]");
  s = s.replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, "Bearer [redacted]");
  s = s.replace(/"api_key"\s*:\s*"[^"]+"/gi, '"api_key":"[redacted]"');
  s = s.replace(/x-api-key:\s*[^\s]+/gi, "x-api-key: [redacted]");
  return s;
}

export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const c = (error as { code?: unknown }).code;
    return typeof c === "string" || typeof c === "number" ? String(c) : undefined;
  }
  return undefined;
}

export function serializeWorkerError(error: unknown): {
  name?: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: string;
} {
  if (error instanceof Error) {
    const cause =
      error.cause instanceof Error
        ? error.cause.message
        : error.cause != null && typeof error.cause !== "object"
          ? String(error.cause)
          : undefined;
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: getErrorCode(error),
      cause,
    };
  }
  return { message: String(error) };
}

export function relatedRecordIdFromPayload(payload: AutomationJobPayload): string | undefined {
  const p = payload as unknown as Record<string, unknown>;
  for (const key of ["jobId", "applicationId", "documentId", "interviewId", "relatedRecordId"]) {
    const v = p[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}
