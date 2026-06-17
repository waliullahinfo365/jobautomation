"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOOGLE_DRIVE_FULL_SCOPE = exports.GOOGLE_DOCUMENTS_SCOPE = exports.GOOGLE_DRIVE_FILE_SCOPE = exports.GOOGLE_DRIVE_DOCS_WORKER_SCOPES = exports.GOOGLE_OAUTH_SCOPES = void 0;
exports.getGoogleScopesForProvider = getGoogleScopesForProvider;
exports.scopeGranted = scopeGranted;
exports.scopesGrantAll = scopesGrantAll;
exports.missingGoogleScopes = missingGoogleScopes;
/**
 * OAuth scopes requested per Google-backed integration.
 * - Reports & doc generation use Drive API create + Docs API batchUpdate → needs `documents` + `drive.file`.
 * - Gmail send requires `gmail.send`.
 */
exports.GOOGLE_OAUTH_SCOPES = {
    Gmail: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.send",
    ],
    "Google Drive": [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/documents",
    ],
    "Google Calendar": ["https://www.googleapis.com/auth/calendar.events"],
};
/** Scopes workers need when creating/editing Google Docs (digests, weekly reports, AI output, CV routing). */
exports.GOOGLE_DRIVE_DOCS_WORKER_SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/documents",
];
/** Canonical URLs requested at OAuth time (must match worker checks). */
exports.GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
exports.GOOGLE_DOCUMENTS_SCOPE = "https://www.googleapis.com/auth/documents";
/** Full Drive scope (older OAuth grants) satisfies drive.file for Drive API file ops. */
exports.GOOGLE_DRIVE_FULL_SCOPE = "https://www.googleapis.com/auth/drive";
const GOOGLE_PROVIDERS = ["Gmail", "Google Drive", "Google Calendar"];
function getGoogleScopesForProvider(provider) {
    if (!GOOGLE_PROVIDERS.includes(provider))
        return [];
    const scopes = exports.GOOGLE_OAUTH_SCOPES[provider];
    return [...scopes];
}
function normalizeScope(s) {
    return s.trim();
}
/** Whether `granted` satisfies `required` (full Drive scope counts as drive.file). */
function scopeGranted(granted, required) {
    const g = new Set((granted ?? []).map(normalizeScope));
    const r = normalizeScope(required);
    if (g.has(r))
        return true;
    if (r === exports.GOOGLE_DRIVE_FILE_SCOPE && g.has(exports.GOOGLE_DRIVE_FULL_SCOPE))
        return true;
    return false;
}
function scopesGrantAll(granted, required) {
    return required.every((s) => scopeGranted(granted, s));
}
function missingGoogleScopes(granted, required) {
    return required.filter((s) => !scopeGranted(granted, s));
}
