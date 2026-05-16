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
    model: "claude-3-5-sonnet-latest",
    displayName: "Claude 3.5 Sonnet (Recommended)",
    recommendedFor: ["research", "drafts", "analysis"],
    supportsJson: true,
    maxTokens: 200_000,
  },
  {
    provider: "Claude",
    model: "claude-3-5-haiku-latest",
    displayName: "Claude 3.5 Haiku (Fast)",
    recommendedFor: ["fast drafts", "summaries", "classification"],
    supportsJson: true,
    maxTokens: 200_000,
  },
  {
    provider: "Claude",
    model: "claude-3-opus-latest",
    displayName: "Claude 3 Opus (Most capable)",
    recommendedFor: ["complex reasoning", "long-form"],
    supportsJson: true,
    maxTokens: 200_000,
  },
];

export const DEFAULT_AI_PROVIDER: AiProvider = "Claude";
export const DEFAULT_AI_MODEL = "claude-3-5-sonnet-latest";
