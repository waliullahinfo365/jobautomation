# Schema Gap Notes

No critical blocker gap was found for proceeding with backend implementation. Current models can support all 17 scenario migrations with service-layer conventions.

Potential additive fields to consider in a later iteration:

| Model | Missing Field | Why Needed | Suggested Type | Related Make Scenario |
|---|---|---|---|---|
| `Job` | `fingerprintHash` | Strong idempotency for intake/dedupe | `string` (indexed) | 01, 02 |
| `Application` | `lastProviderMessageId` | Deterministic reply correlation | `string` | 07 |hjhjh
| `AutomationLog` | `idempotencyKey` | Prevent duplicate side effects on retries | `string` | 04, 08, 14, 16, 17 |
| `Document` | `checksum` | Conversion/routing duplicate safety | `string` | 06, 09 |
| `Report` | `periodKey` | Enforce once-per-day/week digest/report rules | `string` (indexed) | 16, 17 |

These are recommended enhancements, not required schema changes for the immediate implementation start.
