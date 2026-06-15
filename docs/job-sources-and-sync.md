# Where jobs come from (sync expectations)

This product does **not** automatically pull listings from every job board API (Indeed, Stepstone, etc.) out of the box.

## What typically creates jobs today

1. **Gmail job intake** (automation worker) — emails that look like job opportunities can create jobs when Gmail is connected and the intake worker runs. The parser may infer a source label (e.g. from sender or links), but ingestion is **email-driven**, not a native Indeed/Xing API sync.
2. **Manual add** — Jobs → Add job (or similar).
3. **Quick Review / extensions** — Roles the user saves from LinkedIn or other flows you wire in separately.

So if a client sees “only LinkedIn” or “nothing from other platforms,” that usually means **only that path is configured or used**, not that the app is blocking other boards. Adding more sources means **product/integration work** (e.g. more email rules, board APIs, CSV import, or browser capture), not a single toggle.

## Documents vs jobs

Uploading a **general CV** should use **Documents → Workspace library (no related job)**. Linking a job is **optional** and only for files that belong to one specific listing.
