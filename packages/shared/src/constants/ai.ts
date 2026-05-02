import type { AiModelOption, AiProvider } from "../types/ai";

export const AI_MODEL_OPTIONS: AiModelOption[] = [
  {
    provider: "OpenAI",
    model: "gpt-4o-mini",
    displayName: "GPT-4o mini",
    recommendedFor: ["drafts", "classification", "low-latency"],
    supportsJson: true,
    maxTokens: 128_000,
  },
  {
    provider: "OpenAI",
    model: "gpt-4.1-mini",
    displayName: "GPT-4.1 mini",
    recommendedFor: ["research", "drafts"],
    supportsJson: true,
    maxTokens: 128_000,
  },
  {
    provider: "OpenAI",
    model: "gpt-4.1",
    displayName: "GPT-4.1",
    recommendedFor: ["complex reasoning", "long context"],
    supportsJson: true,
    maxTokens: 128_000,
  },
  {
    provider: "Claude",
    model: "claude-3-5-haiku-latest",
    displayName: "Claude 3.5 Haiku",
    recommendedFor: ["fast drafts", "summaries"],
    supportsJson: true,
    maxTokens: 200_000,
  },
  {
    provider: "Claude",
    model: "claude-3-7-sonnet-latest",
    displayName: "Claude 3.7 Sonnet",
    recommendedFor: ["research", "long-form"],
    supportsJson: true,
    maxTokens: 200_000,
  },
  {
    provider: "Stub",
    model: "deterministic-stub-v1",
    displayName: "Deterministic stub (dev)",
    recommendedFor: ["local dev", "deterministic demos"],
    supportsJson: false,
    maxTokens: 0,
  },
];

export const DEFAULT_AI_PROVIDER: AiProvider = "Stub";
export const DEFAULT_AI_MODEL = "deterministic-stub-v1";
