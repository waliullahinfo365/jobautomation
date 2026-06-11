import type { AiModelOption, AiProviderConfig } from "@/types/ai";
import { apiFetch } from "./client";

export type AiConfigResponse = {
  active: AiProviderConfig;
  claude?: AiProviderConfig;
  models: AiModelOption[];
};

export type AiUsageSummaryResponse = {
  totalEstimatedCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byProvider: Record<string, number>;
  byRunType: Record<string, number>;
  entries: number;
};

export type AiTestResponse = {
  provider: string;
  model: string;
  usedStub: boolean;
  confidence: number;
  summary: string;
  keyRequirements: string[];
  usage?: { estimatedInputTokens: number; estimatedOutputTokens: number; estimatedCost: number };
};

export function getAiConfig(): Promise<AiConfigResponse> {
  return apiFetch<AiConfigResponse>("/ai/config");
}

export function getAiUsage(query?: { start?: string; end?: string }): Promise<AiUsageSummaryResponse> {
  const q = query?.start || query?.end ? `?${new URLSearchParams({ ...(query.start ? { start: query.start } : {}), ...(query.end ? { end: query.end } : {}) }).toString()}` : "";
  return apiFetch<AiUsageSummaryResponse>(`/ai/usage${q}`);
}

export function testAi(body: { provider?: "Claude" | "Stub"; model?: string; samplePrompt?: string } = {}): Promise<AiTestResponse> {
  return apiFetch<AiTestResponse>("/ai/test", { method: "POST", body });
}
