# Architecture

## Monorepo layout
- `apps/web`: Next.js dashboard frontend
- `apps/api`: Express API service
- `apps/workers`: automation workers replacing Make.com scenarios
- `packages/shared`: shared types/constants/schemas/utils
- `packages/database`: future centralized MongoDB models and migrations
- `packages/integrations`: external API adapters (gmail/drive/calendar/ai/smtp/notion)

## Runtime split
- web handles UI + client workflows
- api handles auth, tenancy, billing endpoints, CRUD APIs
- workers process async automations, schedules, and notifications
