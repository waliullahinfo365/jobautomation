# Google Automation Pipeline (Stubbed)

## What is implemented
- Tenant-safe backend services for folder provisioning, CV routing, PDF export base, and interview calendar event scheduling.
- Deterministic Google Drive and Google Calendar integration stubs (no external API/OAuth calls).
- Idempotent automation behavior with operation-level logging in `AutomationLog`.
- API endpoint wiring for direct execution and automation module execution (`execute=true` support).
- Worker-ready processor/job stubs for future BullMQ/Redis integration.

## What is stubbed
- Google OAuth is not implemented.
- Real Google Drive API calls are not implemented.
- Real Google Calendar API calls are not implemented.
- Real PDF generation/rendering is not implemented; only deterministic export metadata/url is generated.

## Folder automation flow
1. Request provision for `jobId`.
2. Tenant-scoped job lookup.
3. Idempotency key: `folder-automation:<tenantId>:<jobId>`.
4. If already provisioned (`folderCreated` + `driveFolderId`), return existing result.
5. Call `createJobFolderTreeStub`.
6. Update `Job` with folder metadata/status.
7. Upsert folder marker `Document` records (Job Folder, CV Folder, Cover Letters Folder, Research Folder, Exports Folder).
8. Write automation log with module key `folder-automation`.

## CV routing flow
1. Request route CV for `documentId` + `jobId`.
2. Tenant-scoped `Document` + `Job` lookup.
3. If job folder missing, call folder provisioning service first.
4. Idempotency key: `cv-routing:<tenantId>:<documentId>:<jobId>`.
5. If already routed (`routedToJobFolder` + `targetPath`), return existing result.
6. Call `routeFileToFolderStub`.
7. Update `Document` routing fields/status.
8. Write automation log with module key `cv-routing`.

## PDF export flow
1. Request export for `documentId`.
2. Tenant-scoped `Document` lookup.
3. Idempotency key: `pdf-export:<tenantId>:<documentId>:<version|updatedAt>`.
4. If already exported (`pdfExportStatus=Exported` + `pdfUrl`), return existing result.
5. Call `exportDocumentToPdfStub`.
6. Update `Document` export fields/status.
7. Write automation log with module key `pdf-export`.

## Interview calendar flow
1. Request calendar event creation for `interviewId`.
2. Tenant-scoped `Interview` lookup.
3. Idempotency key: `interview-scheduling:<tenantId>:<interviewId>:<dateTime>`.
4. If already created (`calendarStatus=Created` + `calendarEventId`), return existing result.
5. Call `createCalendarEventStub`.
6. Update `Interview` calendar fields/status.
7. Write automation log with module key `interview-scheduling`.

## Endpoints
- `POST /jobs/:id/folders/provision`
- `POST /documents/:id/route-cv` with body `{ "jobId": "<jobId>" }`
- `POST /documents/:id/export-pdf`
- `POST /interviews/:id/create-calendar-event`
- `POST /integrations/google-drive/test`
- `POST /integrations/google-calendar/test`
- `POST /automation/modules/:moduleKey/run` with `execute=true` for:
  - `folder-automation` (requires `jobId`)
  - `cv-routing` (requires `documentId` + `jobId`)
  - `pdf-export` (requires `documentId`)
  - `interview-scheduling` (requires `interviewId`)

## Example curl: folder provision
```bash
curl -X POST "http://localhost:4000/jobs/<jobId>/folders/provision" \
  -H "x-tenant-id: <tenantId>" \
  -H "content-type: application/json"
```

## Example curl: CV routing
```bash
curl -X POST "http://localhost:4000/documents/<documentId>/route-cv" \
  -H "x-tenant-id: <tenantId>" \
  -H "content-type: application/json" \
  -d '{"jobId":"<jobId>"}'
```

## Example curl: PDF export
```bash
curl -X POST "http://localhost:4000/documents/<documentId>/export-pdf" \
  -H "x-tenant-id: <tenantId>" \
  -H "content-type: application/json"
```

## Example curl: calendar event creation
```bash
curl -X POST "http://localhost:4000/interviews/<interviewId>/create-calendar-event" \
  -H "x-tenant-id: <tenantId>" \
  -H "content-type: application/json"
```

## Idempotency behavior
- Re-running the same operation for already-completed resources returns existing results instead of duplicating records.
- Idempotency keys are persisted on automation logs and are deterministic by tenant/resource identifiers.

## Current limitations
- Stub-only URLs/IDs are generated deterministically and are not externally reachable.
- Folder marker documents are metadata placeholders, not actual remote files.
- Worker processors are queue-ready placeholders and do not yet run through BullMQ/Redis.

## TODO
- Implement real Google OAuth token exchange and refresh lifecycle.
- Implement real Google Drive folder/file and PDF export API integration.
- Implement real Google Calendar event CRUD integration.
