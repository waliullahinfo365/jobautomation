import type { IntegrationProvider } from "../types/integration";
/**
 * OAuth scopes requested per Google-backed integration.
 * - Reports & doc generation use Drive API create + Docs API batchUpdate → needs `documents` + `drive.file`.
 * - Gmail send requires `gmail.send`.
 */
export declare const GOOGLE_OAUTH_SCOPES: {
    readonly Gmail: readonly ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/gmail.send"];
    readonly "Google Drive": readonly ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/documents"];
    readonly "Google Calendar": readonly ["https://www.googleapis.com/auth/calendar.events"];
};
/** Scopes workers need when creating/editing Google Docs (digests, weekly reports, AI output, CV routing). */
export declare const GOOGLE_DRIVE_DOCS_WORKER_SCOPES: readonly ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/documents"];
/** Canonical URLs requested at OAuth time (must match worker checks). */
export declare const GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export declare const GOOGLE_DOCUMENTS_SCOPE = "https://www.googleapis.com/auth/documents";
/** Full Drive scope (older OAuth grants) satisfies drive.file for Drive API file ops. */
export declare const GOOGLE_DRIVE_FULL_SCOPE = "https://www.googleapis.com/auth/drive";
export declare function getGoogleScopesForProvider(provider: IntegrationProvider): string[];
/** Whether `granted` satisfies `required` (full Drive scope counts as drive.file). */
export declare function scopeGranted(granted: string[] | undefined, required: string): boolean;
export declare function scopesGrantAll(granted: string[] | undefined, required: readonly string[]): boolean;
export declare function missingGoogleScopes(granted: string[] | undefined, required: readonly string[]): string[];
