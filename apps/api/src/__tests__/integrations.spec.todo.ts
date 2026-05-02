/**
 * Planned integration tests — enable when a test runner + DB harness are wired.
 *
 * Cases:
 * - GET /integrations returns all known catalog providers even without DB rows
 * - POST .../connect upserts tenant-scoped IntegrationConnection
 * - POST .../disconnect sets Disabled and clears sensitive metadata
 * - POST .../test on Connected provider returns Success stub
 * - tenant A cannot read tenant B integration rows
 * - list/connect responses never include raw apiKey
 * - viewer role cannot connect or disconnect (403)
 */

export {};
