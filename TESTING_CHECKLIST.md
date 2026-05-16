# Production Testing Checklist

## Pre-Deploy

- [ ] All three packages build without errors: `pnpm --filter @jobflow/api build`, `pnpm --filter @jobflow/workers build`, `pnpm --filter @jobflow/web build`
- [ ] TypeScript clean: `npx tsc --noEmit -p apps/api/tsconfig.json`
- [ ] Required env vars set: `MONGODB_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`

---

## Core Auth

- [ ] Register a new account → tenant created → redirected to dashboard
- [ ] Log in with correct credentials → JWT issued
- [ ] Log in with wrong password → 401 returned, no token
- [ ] JWT expiry → redirect to login

---

## Integrations

### Gmail
- [ ] Connect Gmail via OAuth → status shows "Connected" on System Status
- [ ] Disconnect → status reverts to "Not Connected"

### Google Drive
- [ ] Connect Drive via OAuth → folder automation processor can create folders

### Google Calendar
- [ ] Connect Calendar via OAuth → interview scheduling can create real events
- [ ] Without Calendar connected → "Google Calendar not connected" message returned (no fake URL stored)

### Resend
- [ ] With `RESEND_API_KEY` + `RESEND_FROM_EMAIL` set → System Status shows "healthy"
- [ ] Without → shows "not_configured" (not an error)

### Telegram / Slack
- [ ] With env vars set → automation events trigger notifications
- [ ] Without → system continues normally, no crash

---

## Automation Modules

### Offer Tracking
- [ ] Sync emails for an application with offer-like content → `offerStage` populated on Application
- [ ] High-confidence formal offer (≥0.85, stage = written/verbal) → `applicationStatus` promoted to "Offer"
- [ ] In-app bell notification created with link to `/applications`
- [ ] Same email synced twice → idempotency key prevents duplicate processing

### Network Follow-Up
- [ ] Contact with `nextFollowUpDate` in the past → AI suggestion generated, in-app notification created
- [ ] Contact last contacted >30 days ago → same trigger
- [ ] Re-running same day → no duplicate notification (daily idempotency key)
- [ ] No external emails sent (suggestions only)

### Interview Scheduling
- [ ] With Google Calendar connected: create interview → calendar event created → real `htmlLink` URL stored
- [ ] Without Google Calendar: create interview → returns "pending" status, no fake URL stored in DB
- [ ] Interview already has `calendarEventId` + status "Created" → returns "existing" without calling API again

### Folder Automation
- [ ] New application created → Drive folder created → folder URL saved to Application
- [ ] Google Drive not connected → graceful skip, status logged

### CV Routing / Job Intake
- [ ] Email with CV attachment → parsed by Anthropic → Application created
- [ ] Gmail not connected → job skipped, not crashed

### Deadline Alerts
- [ ] Application with `deadline` within alert window → notification triggered

### Follow-Up Reminders
- [ ] Stale application → follow-up reminder notification created

---

## System Status Page (`/system-status`)

- [ ] API row: "healthy" when server is running
- [ ] Database row: reflects real MongoDB connection state
- [ ] Queue row: "healthy" for BullMQ (Redis), "warning" for in-memory
- [ ] Worker row: "healthy" if automation log created in last 30 min
- [ ] Gmail / Drive / Calendar rows: reflect actual OAuth connection status
- [ ] AI Provider row: "healthy" if `ANTHROPIC_API_KEY` set or Claude integration connected
- [ ] Resend row: "healthy" if env vars set
- [ ] Recent failed logs section: shows real failures with timestamps

---

## Billing (when activated)

- [ ] Without Stripe env vars → Billing tab hidden in Settings
- [ ] With Stripe env vars → Billing tab visible
- [ ] Click "Upgrade" → redirects to real Stripe Checkout page
- [ ] Stripe webhook `customer.subscription.updated` → tenant plan updated in DB
- [ ] "Manage billing" → redirects to Stripe Customer Portal

---

## Security

- [ ] API endpoints without auth token → 401
- [ ] Tenant A cannot access Tenant B's data (all queries scoped by `tenantId`)
- [ ] Stripe webhook without valid signature → 400 (HMAC verification active)
- [ ] CV / cover letter text not logged (check API logs)
- [ ] No API keys in application logs

---

## Data Integrity

- [ ] Idempotency: running any automation processor twice in same day → second run returns early, no duplicate DB writes
- [ ] Offer fields on Application (`offerStage`, `offerSummary`, etc.) persisted after page reload
- [ ] Calendar event URL on Interview is a real `https://calendar.google.com/...` link (not `calendar.stub.local`)
