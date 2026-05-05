/** Web-only AI model catalog for settings UI (no dependency on @jobflow/shared). */
export const AI_MODEL_OPTIONS = [
  { provider: "openai", model: "gpt-4o", label: "OpenAI GPT-4o" },
  { provider: "openai", model: "gpt-4o-mini", label: "OpenAI GPT-4o Mini" },
  { provider: "claude", model: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { provider: "claude", model: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
  { provider: "stub", model: "deterministic-stub-v1", label: "Deterministic Stub" },
] as const;
