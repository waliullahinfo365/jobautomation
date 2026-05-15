import type { AiProvider } from "@jobflow/shared/types/ai";
import type { Request } from "express";
import { runResearchGeneration as integrationRunResearch } from "@jobflow/integrations/ai/ai.service";
import { getAiUsageSummary } from "../services/ai-usage.service";
import { getTenantAiConfig, resolveAiProviderForTenant } from "../services/ai-provider-config.service";
import { assertTenantId } from "../services/baseTenant.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";

export const getAiConfig = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const config = await getTenantAiConfig({ tenantId });
  return successResponse(res, config, "AI configuration");
});

export const getAiUsage = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const start = req.query.start ? new Date(String(req.query.start)) : undefined;
  const end = req.query.end ? new Date(String(req.query.end)) : undefined;
  const summary = await getAiUsageSummary({ tenantId, startDate: start, endDate: end });
  return successResponse(res, summary, "AI usage summary");
});

export const testAi = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const body = req.body as { provider?: AiProvider; model?: string; samplePrompt?: string };
  const cfg = await resolveAiProviderForTenant({
    tenantId,
    preferredProvider: body.provider,
  });
  const merged = { ...cfg, model: body.model ?? cfg.model };
  const prompt = body.samplePrompt ?? "Summarize a software engineering role in one paragraph.";
  const wrapped = await integrationRunResearch({
    job: {
      company: "Acme Corp",
      position: "Senior Engineer",
      description: prompt,
      location: "Remote",
    },
    config: merged,
  });
  return successResponse(
    res,
    {
      provider: wrapped.provider,
      model: wrapped.model,
      usedStub: wrapped.usedStub,
      confidence: wrapped.confidence,
      summary: wrapped.data.summary,
      keyRequirements: wrapped.data.keyRequirements,
      usage: wrapped.usage,
    },
    "AI test"
  );
});
