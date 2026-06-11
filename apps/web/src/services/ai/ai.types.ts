export type AIProvider = "anthropic";

export interface AICompletionOptions {
  model?:       string;
  maxTokens?:   number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AICompletionResult {
  text:         string;
  provider:     AIProvider;
  model:        string;
  inputTokens:  number;
  outputTokens: number;
  durationMs:   number;
}
