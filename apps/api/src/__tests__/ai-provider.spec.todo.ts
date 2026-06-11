/**
 * AI provider preparation — planned tests (enable with runner + DB).
 *
 * - No connected Claude returns Stub runtime config
 * - Claude connect persists encrypted key; list/config responses only show preview
 * - Raw API key never appears in JSON responses
 * - logAiUsage increments tenant AI credits
 * - POST /ai/test returns stub result when fallbackToStub / no SDK
 * - fallbackToStub=true prevents external call (no SDK invocation)
 */

export {};
