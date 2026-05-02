import { AiUsageLogModel } from "@database/models";
import type { AiProvider } from "@shared/types/ai";
import { assertTenantId } from "./baseTenant.service";
import { incrementUsage } from "./usage.service";

export function estimateTokensFromText(text: string): { input: number; output: number } {
  const n = text?.length ?? 0;
  const input = Math.max(1, Math.ceil(n / 4));
  const output = Math.max(1, Math.ceil(input * 0.35));
  return { input, output };
}

export function estimateCost(input: {
  provider: AiProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): number {
  if (input.provider === "Stub") return 0;
  const inM = input.inputTokens / 1_000_000;
  const outM = input.outputTokens / 1_000_000;
  const inRate = input.provider === "OpenAI" ? 0.15 : 0.25;
  const outRate = input.provider === "OpenAI" ? 0.6 : 1.25;
  void input.model;
  return inM * inRate + outM * outRate;
}

function creditsFromTokens(inputTokens: number, outputTokens: number): number {
  return Math.max(1, Math.ceil((inputTokens + outputTokens) / 500));
}

export async function logAiUsage(input: {
  tenantId: string;
  userId?: string;
  provider: AiProvider;
  model: string;
  runType: string;
  operationId?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  inputText?: string;
  outputText?: string;
  usedStub: boolean;
}): Promise<void> {
  const tenantId = assertTenantId(input.tenantId);
  const inTxt = input.inputText ?? "";
  const outTxt = input.outputText ?? "";
  const estimatedInputTokens = inTxt ? estimateTokensFromText(inTxt).input : 0;
  const estimatedOutputTokens = outTxt ? estimateTokensFromText(outTxt).output : 0;
  const estimatedCost = estimateCost({
    provider: input.provider,
    model: input.model,
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
  });

  await AiUsageLogModel.create({
    tenantId,
    createdBy: input.userId ?? "system",
    userId: input.userId,
    provider: input.provider,
    model: input.model,
    runType: input.runType,
    operationId: input.operationId,
    relatedRecordType: input.relatedRecordType,
    relatedRecordId: input.relatedRecordId,
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCost,
    usedStub: input.usedStub,
  });

  const credits = creditsFromTokens(estimatedInputTokens, estimatedOutputTokens);
  await incrementUsage({ tenantId, metric: "aiCreditsUsedThisMonth", amount: credits });
}

export async function getAiUsageSummary(input: {
  tenantId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalEstimatedCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byProvider: Record<string, number>;
  byRunType: Record<string, number>;
  entries: number;
}> {
  const tenantId = assertTenantId(input.tenantId);
  const match: Record<string, unknown> = { tenantId };
  if (input.startDate || input.endDate) {
    match.createdAt = {};
    if (input.startDate) (match.createdAt as Record<string, Date>).$gte = input.startDate;
    if (input.endDate) (match.createdAt as Record<string, Date>).$lte = input.endDate;
  }

  const rows = await AiUsageLogModel.find(match).lean();
  let totalEstimatedCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const byProvider: Record<string, number> = {};
  const byRunType: Record<string, number> = {};

  for (const r of rows) {
    totalEstimatedCost += Number(r.estimatedCost ?? 0);
    totalInputTokens += Number(r.estimatedInputTokens ?? 0);
    totalOutputTokens += Number(r.estimatedOutputTokens ?? 0);
    const p = String(r.provider);
    const rt = String(r.runType);
    byProvider[p] = (byProvider[p] ?? 0) + 1;
    byRunType[rt] = (byRunType[rt] ?? 0) + 1;
  }

  return {
    totalEstimatedCost,
    totalInputTokens,
    totalOutputTokens,
    byProvider,
    byRunType,
    entries: rows.length,
  };
}
