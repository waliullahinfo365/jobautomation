/**
 * Web-side AI types aligned with API responses (no @jobflow/shared).
 */

export type AiProvider = "OpenAI" | "Claude" | "Stub";

export type AiModelOption = {
  provider: AiProvider;
  model: string;
  displayName: string;
  recommendedFor: string[];
  supportsJson: boolean;
  maxTokens: number;
};

export type AiProviderConfig = {
  provider: AiProvider;
  model: string;
  apiKeyPreview?: string;
  enabled: boolean;
  fallbackToStub: boolean;
  monthlyUsageLimit?: number;
};
