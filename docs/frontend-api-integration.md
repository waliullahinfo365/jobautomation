# Frontend API Integration Layer

## Environment variables

Frontend API config now uses:

- `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`)
- `NEXT_PUBLIC_DEMO_TENANT_ID`
- `NEXT_PUBLIC_DEMO_USER_ID`
- `NEXT_PUBLIC_USE_MOCK_FALLBACK`
- `NEXT_PUBLIC_AUTH_TOKEN_KEY` (optional; localStorage key for JWT from `/auth/login` — see `getAuthToken` / `setAuthToken` in `apps/web/src/lib/api/client.ts`)

Defined in `apps/web/src/config/env.ts` and `apps/web/.env.example`.

When an access token is stored, `apiFetch` sends **`Authorization: Bearer`** and skips demo `x-tenant-id` / `x-user-id`. Server-side behavior is documented in `docs/auth-rbac-security.md`.

## Headers and request shape

`apps/web/src/lib/api/client.ts` handles:

- base URL
- JSON headers
- `x-tenant-id`
- `x-user-id`
- timeout (20s)
- safe JSON parsing
- `ApiError` with status, code, requestId, network markers

Expected backend response:

```json
{ "success": true, "data": {} }
```

Expected backend error:

```json
{ "success": false, "error": { "message": "...", "code": "...", "requestId": "..." } }
```

## API resource modules

Added in `apps/web/src/lib/api/`:

- `jobs.api.ts`
- `applications.api.ts`
- `contacts.api.ts`
- `interviews.api.ts`
- `documents.api.ts`
- `reports.api.ts`
- `automation.api.ts`
- `integrations.api.ts`
- `billing.api.ts`
- `tenants.api.ts`

These map directly to backend endpoints and keep UI files clean.

## Hooks

Created lightweight hooks (no React Query install required):

- `useApiQuery`
- `useApiMutation`

Resource hooks in `apps/web/src/hooks/api/`:

- `useJobsApi`
- `useApplicationsApi`
- `useContactsApi`
- `useInterviewsApi`
- `useDocumentsApi`
- `useReportsApi`
- `useAutomationApi`
- `useBillingApi`
- `useIntegrationsApi`
- `useTenantApi`

Each exposes loading/error/refetch and mutation helpers.

## Mock fallback mode

`apps/web/src/lib/api/mockFallback.ts` controls fallback:

- use fallback when API is unavailable and `NEXT_PUBLIC_USE_MOCK_FALLBACK=true`
- maps resources to existing mock data files
- does not remove or rewrite current mock datasets

## Connected pages

### Settings > Integrations

- Client: `apps/web/src/components/settings/IntegrationsSection.tsx` uses `useIntegrationsApi({ fallbackToMock: true })`.
- API: `listIntegrations`, `getIntegrationHealth`, `connectIntegration`, `disconnectIntegration`, `testIntegration` in `apps/web/src/lib/api/integrations.api.ts`.
- Mock fallback keys: `integrations` (list) and `integrationsHealth` (health summary) in `apps/web/src/lib/api/mockFallback.ts`; seed data in `apps/web/src/data/mockSettings.ts` (`mockIntegrationListItems`, `mockIntegrationsHealth`).
- UI: health summary strip, per-provider cards, connect modal (`IntegrationConnectModal`), test result display, disconnect confirm (`ConfirmDialog`), `ApiStatusIndicator`. Offline fallback updates local demo state with an info toast (see `docs/integrations-setup-flow.md`).

### Settings > Billing (Phase 1 — proof-of-integration)

- loads billing plan and usage via API hook
- supports stubbed change-plan / checkout actions
- shows loading and error states
- gracefully falls back to mock data
- includes `ApiStatusIndicator` (Connected / Using Mock Data / Offline)

### Dashboard `/dashboard` (Phase 2)

Client component: `apps/web/src/components/dashboard/DashboardPageClient.tsx`

- uses `useJobsApi`, `useApplicationsApi`, `useAutomationApi`
- computes all 6 dashboard stats (jobs tracked, applications sent, interviews, offers, follow-ups, automations active) from live API data
- falls back to `mockJobs`, `mockApplications`, `automationModules` if API unavailable
- shows `ApiStatusIndicator` in the page header when using mock data
- shows `LoadingState` on initial load
- `automationLogs` now fetch from `GET /automation/logs` with `automationLogs` fallback key

### Jobs list `/jobs` (Phase 2)

File: `apps/web/src/app/(dashboard)/jobs/page.tsx`

- uses `useJobsApi({ fallbackToMock: true })` for live data
- normalizes API responses via `normalizeListResponse` + `normalizeJobForUi`
- keeps existing filters, search, table/board views
- shows `ApiStatusIndicator` in the header when using mock fallback
- archive action calls `DELETE /jobs/:id/archive` and refetches the list
- generate research/draft actions call the queue endpoints (execute=false by default)
- shows `LoadingState` on initial load

### Job detail `/jobs/[id]` (Phase 2)

Client component: `apps/web/src/components/jobs/JobDetailPageClient.tsx`

- uses `useJobDetail(id, { fallbackToMock: true, mockFallbackJob })` for single job
- falls back to `mockJobs.find(j => j.id === id)` if API unavailable
- shows premium `EmptyState` with "Back to Jobs" action if job not found
- action buttons (all queue by default, no `execute=true`):
  - **Check Duplicate** → `POST /jobs/:id/check-duplicate`
  - **Generate Research** → `POST /jobs/:id/generate-research`
  - **Generate Draft** → `POST /jobs/:id/generate-draft`
  - **Run AI Processing** → `POST /jobs/:id/ai-processing/run`
  - **Provision Folders** → `POST /jobs/:id/folders/provision`
  - **Archive** → `DELETE /jobs/:id/archive` then redirects to `/jobs`
- action loading states with spinner per button
- shows `ApiStatusIndicator` in action bar when using fallback

## Normalization helpers

### `apps/web/src/lib/api/normalizeResource.ts`

- `normalizeListResponse<T>(payload)` → handles plain arrays, `{ items }`, `{ data }`, `{ results }`
- `normalizePagination(payload)` → extracts `{ total, page, limit, hasMore }`
- `normalizeSingleResource<T>(payload)` → pass-through with type cast

### `apps/web/src/lib/utils/resource.ts`

- `getResourceId(item)` → returns `item.id ?? item._id`
- `normalizeJobForUi(raw)` → sets both `id` and `_id`, aliases `position/title`, `url/jobUrl`, `dateFound/createdAt`, `lastUpdated/updatedAt`, fills defaults for arrays
- `normalizeJobsForUi(raw[])` → maps over array
- `normalizeApplicationForUi(raw)` / `normalizeApplicationsForUi(raw[])` → same pattern for applications
- `normalizeContactForUi` / `normalizeContactsForUi`
- `normalizeInterviewForUi` / `normalizeInterviewsForUi` (maps backend `calendarStatus` *Created* → UI *Synced*, etc.)
- `normalizeDocumentRecordForUi` / `normalizeDocumentRecordsForUi` (maps backend document type/status enums to UI `DocumentType` / `DocumentStatus`)

## Mock fallback improvements

`apps/web/src/hooks/api/useApiQuery.ts` now returns `isUsingFallback: boolean`:

- `true` when data came from mock instead of API
- `false` on successful API response or no fallback triggered
- also falls back to `options.fallbackData` (not just `mockResourceName`) when API fails

`apps/web/src/lib/api/mockFallback.ts` now includes:

- `"automationLogs"` → maps to `mockActivityFeed` converted to `AutomationLog[]`

## Fallback behavior summary

| Condition | Behavior |
|---|---|
| API responds OK | Data from API, `isUsingFallback = false` |
| API down, `MOCK_FALLBACK=true` | Data from mock, `isUsingFallback = true`, `ApiStatusIndicator` shows "Using Mock Data" |
| API down, `MOCK_FALLBACK=false` | `error` set, `ErrorState` shown |
| No data found after API load | `EmptyState` shown |
| First load (no cached data) | `LoadingState` shown |

## Local testing steps

1. Start the backend: `cd apps/api && npm run dev` (port 4000)
2. Start the frontend: `cd apps/web && npm run dev` (port 3000)
3. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `apps/web/.env.local`
4. Set `NEXT_PUBLIC_DEMO_TENANT_ID=<tenantId>` from seeded data
5. Set `NEXT_PUBLIC_USE_MOCK_FALLBACK=true` for offline development
6. Navigate to `/dashboard`, `/jobs`, `/jobs/<id>`, `/applications`, `/contacts`, `/interviews`, `/documents`
7. To test fallback: stop the backend and reload — mock data appears with "Using Mock Data" badge; workflow actions should update **local demo state** with an info toast

## Action endpoints (queue by default)

All write actions from the Jobs pages use `execute=false` (or no execute param), which enqueues the job in the backend queue instead of running it inline. In development, pass `?execute=true` to run inline (blocked in production).

### Applications `/applications` (Phase 3)

Client: `apps/web/src/components/applications/ApplicationsPageClient.tsx`

- uses `useApplicationsApi({ fallbackToMock: true })` with `normalizeListResponse` + `normalizeApplicationsForUi`
- uses `useIntegrationsApi` only for **`replyTest`** (`POST /integrations/gmail/reply-test`)
- shows `LoadingState` / `EmptyState` (no rows vs no filter matches)
- `ApiStatusIndicator` appears subtly above application filters when mock fallback is active
- **Workflow actions**
  - **Mark Applied** → `POST /applications/:id/mark-applied`, success toast, refetch
  - **Schedule Follow-Up** → small modal (datetime-local + optional message), default ~**today + 5 days**, → `POST /applications/:id/schedule-follow-up`
  - **Mark Follow-Up Sent** (table + detail) → `POST /applications/:id/mark-follow-up-sent`
  - **Process Due Follow-Ups** (header action) → `POST /applications/follow-ups/process-due`; toast includes processed/sent/skipped when returned
  - **Simulate Reply** (detail panel) → `replyTest` with demo payload; refetch applications on success
- **Fallback when API offline**: actions patch **component-local** maps keyed by id (does not mutate exported mock arrays); info toast *“API offline, updated demo data locally.”*

API paths in `applications.api.ts` match Express routes: `/applications/follow-ups/due`, `/applications/follow-ups/process-due`, `/applications/:id/schedule-follow-up`, `/applications/:id/mark-follow-up-sent`.

### Contacts `/contacts` (Phase 3)

Client: `apps/web/src/components/contacts/ContactsPageClient.tsx`

- uses `useContactsApi({ fallbackToMock: true })` with `normalizeListResponse` + `normalizeContactsForUi`
- shows `LoadingState` / `EmptyState`
- `ApiStatusIndicator` appears subtly above contact filters when using mock fallback
- **Mark Followed Up** → `POST /contacts/:id/mark-followed-up`, success toast, refetch
- **Add Contact** → modal with name, company, role, relationship, email; live API sends body compatible with `contactCreateSchema` (`tenantId`, `createdBy`, `name`, `relationship`, `email`, `followUpStatus`); company/role appear on locally added demo rows when fallback is on
- **Fallback**: edits use **local partial maps** + optional **appended rows** for creates; same info toast as applications

### Integrations reply-test (demo)

- `integrations.api.ts`: `replyTest(payload)`
- `useIntegrationsApi`: exposes `replyTest` / `gmailReplyTest` (same mutator)

### Interviews `/interviews` (Phase 4)

Client: `apps/web/src/components/interviews/InterviewsPageClient.tsx`

- `useInterviewsApi({ fallbackToMock: true })` with `normalizeListResponse` + `normalizeInterviewsForUi`
- `LoadingState` / `EmptyState` (upcoming tab); `ApiStatusIndicator` on interview filters when using mock fallback
- **Create calendar event** (detail + via same API) → `POST /interviews/:id/create-calendar-event?execute=false` (queued); success toast includes `operationId` / `jobId` / `status` when present; refetch on success
- **Mark complete** (cards + detail) → `POST /interviews/:id/mark-complete`
- **Sync calendar** (header) → info toast: *“Calendar sync will be available after Google OAuth is connected.”*
- **Schedule interview** (modal) → `POST /interviews` with `tenantId` / `createdBy` from demo env + `company`, `position`, `interviewType`, `dateTime` (ISO)
- **Completed** / **Awaiting confirmation** tabs derive from the live/fallback interview list (no extra global mock mutation)
- **Fallback**: local `Record<id, Partial<Interview>>` patches; calendar stub sets `calendarStatus: "Synced"` and a fake `calendarEventId`

### Documents `/documents` (Phase 4)

Client: `apps/web/src/components/documents/DocumentsPageClient.tsx`

- `useDocumentsApi({ fallbackToMock: true })` + `useJobsApi({ fallbackToMock: true })` for CV routing / folder provision job resolution
- `normalizeListResponse` + `normalizeDocumentRecordsForUi`; CV/Cover Letter/Research/PDF tabs are **filtered views** of the same merged document list
- `LoadingState` / `EmptyState`; `ApiStatusIndicator` on document filters when using mock fallback
- **Export PDF** → `POST /documents/:id/export-pdf?execute=false`; fallback updates local `pdfExportStatus`, `pdfUrl`, `status`
- **Route CV** → `POST /documents/:id/route-cv` with `{ jobId }` (`jobId` from document, else **first job** from jobs list); error toast if no job id
- **Upload** → info toast: storage not connected
- **Open folder** → opens `storageUrl` when set; otherwise info toast (Drive not linked)
- **Folder automation** → **Provision Job Folder** calls `jobsApi.provisionFolders({ id: firstJobId, execute: false })`; fallback appends a demo row to local folder activity and shows info toast
- **Fallback**: document patches keyed by id; same info toast as other pages

### Hooks (Phase 4)

- `useInterviewsApi`: `list`, `createInterview`, `updateInterview`, `createCalendarEvent`, `markComplete`, `mutations.*`
- `useDocumentsApi`: `list`, `createDocument`, `updateDocument`, `routeCv`, `exportPdf`, `mutations.*`
- `useJobsApi`: adds `list` alias; `provisionFolders` unchanged (`POST /jobs/:id/folders/provision`)

### Reports `/reports` (Phase 5)

Client: `apps/web/src/components/reports/ReportsPageClient.tsx`

- `useReportsApi({ fallbackToMock: true })` loads list (`GET /reports`), stats (`GET /reports/stats`), daily analytics (`GET /reports/analytics/daily`), weekly analytics (`GET /reports/analytics/weekly`) via `normalizeListResponse` + `normalizeReportsForUi`, `normalizeReportStatsForUi`, `normalizeDailyDigestDataForUi`, `normalizeWeeklyReportDataForUi`
- `LoadingState` on first load; `EmptyState` when no history rows or no filter matches; `ApiStatusIndicator` + **Refresh** in the header (and on Report History filters when mock fallback is active)
- **Generate Report**: Daily Digest tab → `POST /reports/daily-digest/run` with `{ send: false, force: false }`; Weekly Report, Overview, PDF Exports, Report History → `POST /reports/weekly/run` with `{ send: false, force: false }`; success toast surfaces `operationId`, `reportId`, `status`, `deliveryStatus` / message when present; then refetches all report queries
- **Send Test** (Daily Digest / Weekly preview / History): prefers `POST /reports/:id/send-test` with `{ to: NEXT_PUBLIC_DEMO_REPORT_EMAIL }` when a matching history row exists; otherwise `runDailyDigest({ send: true })` or `runWeeklyReport({ send: true })`
- **PDF Exports**: **Export Again** stays an info toast (no new backend); charts on Overview keep mock trend/status datasets while summary metrics derive from normalized analytics
- **Fallback**: append-only local history rows and keyed edits (never mutates exported mock arrays); info toast *“API offline, updated demo report locally.”*; digest card can overlay `deliveryStatus` locally after send-test

### Automation `/automation` (Phase 5)

Client: `apps/web/src/components/automation/AutomationPageClient.tsx`

- `useAutomationApi({ fallbackToMock: true })` loads modules (`GET /automation/modules`) and logs (`GET /automation/logs`); modules are normalized then merged with `mergeAutomationModuleWithMockCatalog` so icons/actions stay aligned with the premium catalog when the API returns sparse rows
- `LoadingState` / `EmptyState`; `ApiStatusIndicator` in header and above filters when using mock fallback; logs table **View** shows a placeholder info toast
- **Run Now** (detail panel): `POST /automation/modules/:moduleKey/run?execute=false` with `{}` payload by default (queued stub); success toast includes `operationId`, `jobId`, `status`; refetches modules + logs
- **Pause / Resume** (cards): `PATCH /automation/modules/:moduleKey` with `{ status }` mapped via `automationUiStatusToBackend` (`Healthy` / `Paused`)
- **Configure**: info toast — *“Configuration will be available in the integrations/settings setup.”*
- **Fallback**: `PATCH`/`run` skipped; local `Record<id, Partial<module>>` overrides for pause/resume; info toasts for offline actions

### Hooks (Phase 5)

- `useReportsApi`: `listQuery`, `statsQuery`, `dailyAnalyticsQuery`, `weeklyAnalyticsQuery`, merged `loading` / `error` / `isUsingFallback`, `refetch` (all four queries), `runDailyDigest`, `runWeeklyReport`, `sendReportTest`, `mutations.*`
- `useAutomationApi`: `modulesQuery`, `logsQuery`, merged `loading` / `error` / `isUsingFallback`, `refetch` (modules + logs), `updateAutomationModule`, `runAutomationModule`, `mutations.*`

### Normalization additions (`resource.ts`)

- Reports: `normalizeReportForUi`, `normalizeReportsForUi`, `normalizeReportStatsForUi`, `normalizeDailyDigestDataForUi`, `normalizeWeeklyReportDataForUi`
- Automation: `normalizeAutomationModuleForUi`, `normalizeAutomationModulesForUi`, `normalizeAutomationLogForUi`, `normalizeAutomationLogsForUi`, `resolveAutomationBackendModuleKey`, `mergeAutomationModuleWithMockCatalog`, `automationUiStatusToBackend`

## TODO

- Resolve tenant/user headers from authenticated session automatically.
- Add centralized retry policy and better toast UX (e.g. react-hot-toast).
- Add request-id display in debug/dev tools.
