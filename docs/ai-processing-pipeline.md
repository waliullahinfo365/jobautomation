# AI Processing Pipeline (Phase 3 Stub)

## What is implemented
- Tenant-safe AI processing service for research/draft/full execution.
- Deterministic stub AI generation (no external API calls).
- Job AI status updates and automation logs for start/success/failure.
- Idempotent document generation (reuses existing research/draft when already generated).
- Placeholder tenant usage increment (`usage.aiCreditsUsedThisMonth`).

## What is stubbed
- No OpenAI/Claude integration yet.
- No queue transport (BullMQ/Redis) yet.
- No prompt registry/version management system yet (version is placeholder in metadata).

## Endpoints
- `POST /jobs/:id/generate-research`
- `POST /jobs/:id/generate-draft`
- `POST /jobs/:id/ai-processing/run`
- `GET /jobs/:id/ai-processing/status`
- `POST /automation/modules/ai-processing/run`
  - queued by default
  - execute directly only with `?execute=true` and `{ "jobId": "...", "mode": "research|draft|full" }`

## Example curl (Research)
```bash
curl -X POST http://localhost:4000/jobs/<jobId>/generate-research \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant-id"
```

## Example curl (Draft)
```bash
curl -X POST http://localhost:4000/jobs/<jobId>/generate-draft \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant-id"
```

## Example curl (Full run)
```bash
curl -X POST http://localhost:4000/jobs/<jobId>/ai-processing/run \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-tenant-id" \
  -d '{"mode":"full"}'
```

## Idempotency behavior
- Research idempotency key: `ai-processing:<tenantId>:<jobId>:research-generation`
- Draft idempotency key: `ai-processing:<tenantId>:<jobId>:draft-generation`
- If `researchGenerated` + matching generated research document exists, service returns existing document without creating new one.
- If `draftGenerated` + matching generated/needs-review draft exists, service returns existing document without creating new one.

## Documents created
- Research:
  - `type: Research`
  - `documentKind: Research`
  - `status: Ready`
  - `generationStatus: Generated`
- Cover letter draft:
  - `type: Cover Letter`
  - `documentKind: Cover Letter`
  - `status: Draft`
  - `generationStatus: Needs Review`

## Tenant usage placeholder
- Estimated AI usage is calculated via deterministic heuristic and increments:
  - `Tenant.usage.aiCreditsUsedThisMonth += estimatedCredits`

## TODO
- Integrate real OpenAI/Claude provider adapter with structured outputs.
- Add prompt/version tracking strategy and versioned templates.
