/** Web-only AI model catalog for settings UI (no dependency on @jobflow/shared). */
export const AI_MODEL_OPTIONS = [
  { provider: "openai", model: "gpt-4o", label: "OpenAI GPT-4o" },
  { provider: "openai", model: "gpt-4o-mini", label: "OpenAI GPT-4o Mini" },
  { provider: "claude", model: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Recommended)" },
  { provider: "claude", model: "claude-opus-4-7", label: "Claude Opus 4.7 (Most capable)" },
  { provider: "claude", model: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Fast)" },
] as const;
