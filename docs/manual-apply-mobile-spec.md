# Manual Apply on Mobile — Product Spec

Client feedback (June 2026): make **manual application** as frictionless as possible on mobile, while LinkedIn auto-apply remains the differentiated long-term bet. Every employer site is different; we cannot adapt to all of them. The product should optimize for **“I’m on my phone, on the employer’s site, and need CV, cover letter, answers, and status logging without headache.”**

---

## Client priorities (ranked)

### 1. One-tap documents on mobile
When the employer form asks for a file (CV, cover letter):

- User taps **CV** or **Cover letter** in our app.
- The file is available immediately for the employer’s “Add file” picker — via **native share sheet** (preferred on iOS/Android) or download.
- No hunting in Drive folders, no desktop-only flows.

**Storage decision (client question):**

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Google Drive (source of truth)** | User already trusts Drive; GDPR-friendly (data stays in user’s Google account); matches existing folder automation | Requires Drive OAuth; export step for PDF upload fields | **Primary path** — already implemented in workers |
| **App-internal bytes storage** | Simpler share without Drive round-trip | Data processor liability, retention policy, backup/security scope | **Avoid for v1** — keep `contentText` in Mongo for AI only, not as file vault |
| **Hybrid** | `contentText` for AI prompts; Drive `googleDriveFileId` for file handoff | Two sources to keep in sync | **Current architecture** — correct for this product |

**Principle:** Drive holds files; Mongo holds metadata + extracted text for AI. Mobile never needs to “browse Drive” — the app streams/exports the resolved active CV or cover letter.

### 2. Document application status in-app
After applying on the employer site, user must log status in seconds:

- **Applied** / **In Progress** / **Rejected** / **Interview**
- Optional notes (“submitted via mobile”, “waiting on assessment”)
- Automatic **+7 day follow-up** when status is Applied or Interview

This is required even for fully manual applies — otherwise reminders and pipeline views break.

### 3. AI answers for free-text questions
On employer forms: “Why are you a fit?”, “Motivation?”, “Salary expectations?” (where appropriate):

- Paste or type the question in our app.
- AI generates **150–300 words** from **job description + workspace CV** (`contentText`).
- **Copy** (and Regenerate) — optimized for mobile paste into Safari/Chrome employer tabs.

### 4. Full documentation → reminders
Every manual apply must create/update one **Application** record linked to the **Job**, with:

- `applyMethod: manual_assistant` (or `manual_log` for quick log-only path)
- `documentIds` referencing CV + cover letter used
- `statusHistory` entries
- `followUpDate` / `followUpStatus` for the reminder engine

### 5. Future (not v1): LinkedIn profile optimization
Separate from apply flow: suggest headline, about, and keyword tweaks so recruiters who land on the profile see a aligned narrative. Depends on LinkedIn session / ToS — track as **Job Assistant → Profile** module later.

---

## Current codebase status (`main` as of June 2026)

### Already built

| Capability | Where |
|------------|--------|
| Gmail job intake | `job-intake` worker, `/jobs/intake-email` |
| CV + cover letter upload → Drive | `document-upload` worker, Documents UI |
| CV `contentText` for AI tailoring | Documents + `workspace-profile` patterns in workers |
| Per-job cover letter generation | `ai-document-generation`, Tailored CV modal |
| Log application (manual) | `LogApplicationModal`, job detail, applications page |
| Mark applied + follow-up scheduling | `applied-status` service, follow-up worker |
| Follow-up reminders | `follow-up-reminder` worker, notifications |
| LinkedIn auto-apply (special) | `job-apply` worker, settings profile card |

### Was built, then reverted (commit `0c84aad` — can be re-shipped)

| Capability | Notes |
|------------|--------|
| **Apply Assistant** mobile page | `/jobs/[id]/apply` — sticky “Complete application” bar |
| **Stream CV / cover letter** | `GET /jobs/:id/apply/documents/:role/stream` — PDF from Drive |
| **Native share** | `navigator.share({ files })` with download fallback |
| **Generate answer** | `POST /jobs/:id/apply/generate-answer` — Claude + CV + job text |
| **Complete apply** | `POST /jobs/:id/apply/complete` — upsert Application, pipeline sync, follow-up |
| **Unified documentation** | `documentApplicationEvent()` — single write path for status + reminders |
| **Missing-doc UX** | Inline cards when CV/cover letter not linked |

Re-shipping this stack is the **fastest path** to satisfy client items 1–4; it was designed exactly for this feedback.

### Gaps after re-ship

- **documentIds on complete** — wire resolved CV + cover letter refs on complete (was in progress before revert).
- **Production Drive verification** — stream/export branch proof on live tenant.
- **PWA / add-to-homescreen** — optional; mobile web already works if share sheet is used.
- **iOS Safari file picker quirks** — test share vs download per MIME type.

---

## Recommended UX flow (mobile)

```
Job detail → [Apply on employer site]  (opens jobUrl in new tab)
           → [Open Apply Assistant]    (same job, our UI)

Apply Assistant screen:
  ┌─────────────────────────────────────┐
  │ Open job posting          (primary) │
  ├─────────────────────────────────────┤
  │ [ Copy CV ]  [ Copy cover letter ]  │  → share sheet / download PDF
  ├─────────────────────────────────────┤
  │ Question: ________________________  │
  │ [ Generate answer ] [ Copy ]        │
  ├─────────────────────────────────────┤
  │ ▓▓▓ Complete application ▓▓▓        │  sticky bottom
  └─────────────────────────────────────┘

Complete sheet:
  Status: Applied | In Progress | Rejected | Interview
  Notes (optional)
  → saves Application, schedules follow-up, syncs pipeline
```

**Design rules:**

- Max **2 taps** to hand off a document (Assistant → Copy CV → employer file picker).
- Max **3 taps** to log Applied (sticky bar → Applied → Save).
- Never require desktop or leaving the employer tab for more than one switch.

---

## API surface (target)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/jobs/:id/apply/documents/status` | Missing CV/cover letter flags before apply |
| GET | `/jobs/:id/apply/documents/:role/stream` | PDF bytes (`cv` \| `cover_letter`) |
| POST | `/jobs/:id/apply/generate-answer` | `{ questionText }` → `{ answer }` |
| POST | `/jobs/:id/apply/complete` | `{ status, notes?, documentIds? }` → Application |

Existing parallel path: `POST /applications` + `LogApplicationModal` for users who skip the assistant.

---

## Implementation phases

### Phase A — Re-ship Apply Assistant (1–2 days)
Restore reverted commit `0c84aad` selectively (API + web + `documentApplicationEvent`), fix `documentIds` on complete, verify Drive stream locally + production.

### Phase B — Mobile polish (1 day)
- Bottom-safe sticky bar (already designed)
- Larger touch targets on Copy / Complete
- Toast on copy success
- Missing-doc inline cards (no silent failures)

### Phase C — Documentation hardening (ongoing)
- Ensure all complete paths call `documentApplicationEvent`
- `applyMethod` distinguishes `manual_assistant` vs `manual_log` vs `linkedin_auto`
- Follow-up worker tested on manual_assistant Applied rows

### Phase D — Future
- LinkedIn profile optimization module
- Optional: employer-site bookmarklet / share extension (“Send question to Job Assistant”)

---

## Client-facing summary (one paragraph)

We will not try to auto-fill every employer website. Instead, the **mobile Apply Assistant** keeps CV and cover letter one tap away (via your Google Drive files, shared into the employer’s upload field), generates **AI answers** from your CV and the job description for copy-paste, and lets you mark **Applied** in two taps so follow-up reminders and pipeline tracking work exactly like automated applies. Files stay in **your Drive** for data protection; the app only stores metadata and text needed for AI. **LinkedIn auto-apply** remains the premium differentiator; profile optimization for recruiters is noted for a later release.

---

## Related docs

- `docs/application-workflow-pipeline.md` — follow-up and applied status
- `docs/cv-tailoring.md` — CV text + AI generation
- `docs/automation-module-specs.md` — `follow-up-reminder`, `cv-routing`, `document-upload`
- `docs/ai-processing-pipeline.md` — AI answer generation patterns
