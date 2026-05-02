/** OAuth scopes requested per Google-backed integration (prepare for production). */
export const GOOGLE_OAUTH_SCOPES = {
    Gmail: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
    ],
    "Google Drive": ["https://www.googleapis.com/auth/drive.file"],
    "Google Calendar": ["https://www.googleapis.com/auth/calendar.events"],
};
const GOOGLE_PROVIDERS = ["Gmail", "Google Drive", "Google Calendar"];
export function getGoogleScopesForProvider(provider) {
    if (!GOOGLE_PROVIDERS.includes(provider))
        return [];
    const scopes = GOOGLE_OAUTH_SCOPES[provider];
    return [...scopes];
}
