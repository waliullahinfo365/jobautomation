# Desktop Apply Agent

Runs LinkedIn Easy Apply **locally** on your Mac or PC using Playwright and your real browser session. This avoids cloud headless detection that logs LinkedIn out on Railway.

## Prerequisites

- Node.js 20+
- Monorepo dependencies installed (`pnpm install` from repo root)
- Playwright Chromium: `pnpm exec playwright install chromium` (from `packages/integrations` if needed)
- API deployed with agent routes enabled

## Setup

1. In **Settings → Integrations → Desktop automation**, click **Generate pairing code**.
2. Pair the agent (10-minute code expiry):

```bash
pnpm apply-agent pair --code 123456 --api-url https://api.newjob.guru
```

3. Save your LinkedIn session locally (one-time, interactive):

```bash
pnpm apply-agent login linkedin
```

4. Run the agent (polls every 2 minutes by default):

```bash
pnpm apply-agent run --api-url https://api.newjob.guru --interval 120000
```

## What it does

- Sends heartbeats to the API so Settings shows agent online/offline
- Fetches jobs with status **Ready to Apply**
- Applies via LinkedIn Easy Apply using your local `~/.newjobguru/linkedin-session.json`
- Posts success/failure back to the API
- Refreshes cookies after each apply when the session is still valid

## Config files

| Path | Purpose |
|------|---------|
| `~/.newjobguru/agent-config.json` | API URL + bearer token |
| `~/.newjobguru/linkedin-session.json` | Playwright storage state |

## Chrome extension (optional)

Load `extensions/linkedin-apply-assistant/` as an unpacked extension for quick links to Apply Assistant on LinkedIn job pages.
