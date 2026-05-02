# AI provider preparation (OpenAI / Claude)

## Stub mode (default)

- If no **OpenAI** or **Claude** integration is **Connected**, `resolveAiProviderForTenant` returns **`Stub`** with model **`deterministic-stub-v1`**.
- All generation paths (`runAiExtraction`, `runResearchGeneration`, `runCoverLetterGeneration` in `@jobflow/integrations`) use **deterministic stub implementations** unless a future real SDK call is wired.
- When **`fallbackToStub`** is true on the integration (default), external APIs are **not** called even if an API key is stored.

## Provider configuration

- Stored on **`IntegrationConnection`** for providers **OpenAI** and **Claude**.
- **`accessTokenEncrypted`**: API key encrypted with `encryptSecret` (see `docs/integrations-setup-flow.md`).
- **`metadata`**: `providerType: "ai"`, `model`, `apiKeyPreview`, `fallbackToStub`, optional demo flags.
- **Responses never include** raw `apiKey` — only `apiKeyPreview`.

## Model options

Canonical list: `packages/shared/src/constants/ai.ts` → **`AI_MODEL_OPTIONS`**, exposed via **`GET /ai/config`**.

## Usage logging

- **`AiUsageLog`** collection (`packages/database/src/models/AiUsageLog.model.ts`) records runs with estimated tokens/cost.
- **`logAiUsage`** also increments **`usage.aiCreditsUsedThisMonth`** on the tenant (placeholder credit heuristic).
- Stub provider runs use **$0** estimated cost in **`estimateCost`**.

## API endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/ai/config` | `integrations.read` **or** `settings.read` |
| GET | `/ai/usage` | `reports.read` **or** `billing.read` |
| POST | `/ai/test` | `integrations.connect` |

`GET /ai/usage` supports optional query `start` and `end` (ISO dates).

## Current limitations

- No real **OpenAI** or **Anthropic** HTTP calls; keys are stored for future use.
- Cost and token numbers are **estimates** only.
- Per-plan AI quota enforcement beyond existing `assertCanUseAiCredits` is **not** fully implemented.

## TODO

- Integrate **OpenAI** and **Anthropic** SDKs behind `shouldUseStub === false` and env/feature flags.
- **Prompt templates** and versioning.
- **Per-plan** AI quota enforcement and billing alignment.
- **Key rotation** and audit for AI secrets.
