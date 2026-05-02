# API Endpoint Plan

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Tenants
- `GET /tenants/current`
- `PATCH /tenants/current`
- `GET /tenants/usage`

## Jobs
- `GET /jobs`
- `POST /jobs`
- `GET /jobs/:id`
- `PATCH /jobs/:id`
- `DELETE /jobs/:id/archive`
- `POST /jobs/:id/check-duplicate`
- `POST /jobs/:id/generate-research`
- `POST /jobs/:id/generate-draft`

## Applications
- `GET /applications`
- `POST /applications`
- `GET /applications/:id`
- `PATCH /applications/:id`
- `POST /applications/:id/mark-applied`
- `POST /applications/:id/schedule-follow-up`
- `POST /applications/:id/mark-follow-up-sent`

## Contacts
- `GET /contacts`
- `POST /contacts`
- `GET /contacts/:id`
- `PATCH /contacts/:id`
- `POST /contacts/:id/mark-followed-up`

## Interviews
- `GET /interviews`
- `POST /interviews`
- `GET /interviews/:id`
- `PATCH /interviews/:id`
- `POST /interviews/:id/create-calendar-event`
- `POST /interviews/:id/mark-complete`

## Documents
- `GET /documents`
- `POST /documents`
- `GET /documents/:id`
- `POST /documents/:id/export-pdf`

## Automation
- `GET /automation/modules`
- `PATCH /automation/modules/:moduleKey`
- `POST /automation/modules/:moduleKey/run`
- `GET /automation/logs`

## Integrations
- `GET /integrations`
- `POST /integrations/:provider/connect`
- `POST /integrations/:provider/disconnect`
- `POST /integrations/:provider/test`

## Reports
- `GET /reports`
- `POST /reports/daily-digest/run`
- `POST /reports/weekly/run`
- `POST /reports/:id/send-test`

## Billing
- `GET /billing/plan`
- `POST /billing/checkout`
- `POST /billing/webhook`

## Notes
- All routes should enforce tenant-safe scoping from auth context (not request body).
- Long-running actions (`generate-*`, conversion, digest/report runs) should enqueue worker jobs and return async operation IDs.
