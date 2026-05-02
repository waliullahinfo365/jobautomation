# Data Flow Diagrams

## A) Job Intake Flow
`Gmail job alert` -> `AI extraction` -> `duplicate check` -> `job created/updated` -> `folder automation queued` -> `dashboard data refreshed`

## B) Application Flow
`Job ready` -> `draft generated` -> `user marks applied` -> `follow-up scheduled` -> `email reply detection` -> `status update (interview/offer/rejection)`

## C) Interview Flow
`Reply detected` -> `AI classifies interview intent` -> `interview record created` -> `calendar event created` -> `prep tasks generated` -> `reminder scheduled`

## D) Reporting Flow
`Daily/weekly scheduler` -> `tenant-scoped data aggregation` -> `report generated` -> `email/message delivery` -> `report + automation logs saved`

## Implementation Notes
- Each arrow should map to a queue boundary for retry and idempotency.
- Every stage writes an `AutomationLog` row with `tenantId`, `moduleKey`, `status`, and correlation metadata.
