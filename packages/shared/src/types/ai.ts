/** Runtime AI provider selection (includes deterministic stub). */
export type AiProvider = "OpenAI" | "Claude" | "Stub";

export type AiModelOption = {
  provider: AiProvider;
  model: string;
  displayName: string;
  recommendedFor: string[];
  supportsJson: boolean;
  maxTokens: number;
};

/** Safe tenant-facing AI integration summary (no raw secrets). */
export type AiProviderConfig = {
  provider: AiProvider;
  model: string;
  apiKeyPreview?: string;
  enabled: boolean;
  fallbackToStub: boolean;
  monthlyUsageLimit?: number;
};

export type AiUsageRecord = {
  tenantId: string;
  provider: AiProvider;
  model: string;
  runType: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  createdAt: string;
};

export type AiServiceResult<T> = {
  provider: AiProvider;
  model: string;
  usedStub: boolean;
  confidence: number;
  data: T;
  usage?: {
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    estimatedCost: number;
  };
};

/** Resolved tenant AI settings for server-side execution (never expose `apiKeyDecrypted` to clients). */
export type AiRuntimeConfig = {
  provider: AiProvider;
  model: string;
  fallbackToStub: boolean;
  apiKeyDecrypted?: string;
};
