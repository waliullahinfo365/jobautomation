import { IntegrationConnectionModel } from "@database/models";
import { AI_MODEL_OPTIONS, DEFAULT_AI_MODEL } from "@shared/constants/ai";
import type { AiProvider, AiProviderConfig, AiRuntimeConfig } from "@shared/types/ai";
import { decryptSecret } from "../utils/encryption";
import { assertTenantId } from "./baseTenant.service";

export function maskApiKey(key: string): string {
  const t = key.trim();
  if (t.length <= 8) return "••••••••";
  return `${t.slice(0, 3)}••••${t.slice(-4)}`;
}

export function getAvailableAiModels() {
  return AI_MODEL_OPTIONS;
}

function safeAiConfigFromRow(row: Record<string, unknown> | null, provider: "OpenAI" | "Claude"): AiProviderConfig | undefined {
  if (!row || row.status !== "Connected") return undefined;
  const meta = (row.metadata as Record<string, unknown>) ?? {};
  return {
    provider,
    model: (meta.model as string) || DEFAULT_AI_MODEL,
    apiKeyPreview: meta.apiKeyPreview as string | undefined,
    enabled: true,
    fallbackToStub: meta.fallbackToStub !== false,
  };
}

export async function getTenantAiConfig(input: { tenantId: string }): Promise<{
  active: AiProviderConfig;
  openai?: AiProviderConfig;
  claude?: AiProviderConfig;
  models: typeof AI_MODEL_OPTIONS;
}> {
  const tenantId = assertTenantId(input.tenantId);
  const [openaiRow, claudeRow] = await Promise.all([
    IntegrationConnectionModel.findOne({ tenantId, provider: "OpenAI" }).lean(),
    IntegrationConnectionModel.findOne({ tenantId, provider: "Claude" }).lean(),
  ]);
  const o = openaiRow as Record<string, unknown> | null;
  const c = claudeRow as Record<string, unknown> | null;
  const openai = safeAiConfigFromRow(o, "OpenAI");
  const claude = safeAiConfigFromRow(c, "Claude");
  const resolved = await resolveAiProviderForTenant({ tenantId });
  const active: AiProviderConfig = {
    provider: resolved.provider,
    model: resolved.model,
    apiKeyPreview:
      resolved.provider === "OpenAI"
        ? openai?.apiKeyPreview
        : resolved.provider === "Claude"
          ? claude?.apiKeyPreview
          : undefined,
    enabled: resolved.provider !== "Stub",
    fallbackToStub: resolved.fallbackToStub,
  };
  return { active, openai, claude, models: AI_MODEL_OPTIONS };
}

export async function resolveAiProviderForTenant(input: {
  tenantId: string;
  preferredProvider?: AiProvider;
}): Promise<AiRuntimeConfig> {
  const tenantId = assertTenantId(input.tenantId);
  const [openaiRow, claudeRow] = await Promise.all([
    IntegrationConnectionModel.findOne({ tenantId, provider: "OpenAI" }).lean(),
    IntegrationConnectionModel.findOne({ tenantId, provider: "Claude" }).lean(),
  ]);

  const pick = (row: Record<string, unknown> | null): AiRuntimeConfig | null => {
    if (!row || row.status !== "Connected") return null;
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    const model = (meta.model as string) || DEFAULT_AI_MODEL;
    const fallbackToStub = meta.fallbackToStub !== false;
    const enc = row.accessTokenEncrypted as string | undefined;
    let apiKeyDecrypted: string | undefined;
    if (enc) {
      try {
        apiKeyDecrypted = decryptSecret(enc);
      } catch {
        apiKeyDecrypted = undefined;
      }
    }
    const providerName = row.provider === "Claude" ? "Claude" : "OpenAI";
    return {
      provider: providerName as AiProvider,
      model,
      fallbackToStub,
      apiKeyDecrypted,
    };
  };

  if (input.preferredProvider === "OpenAI") {
    const p = pick(openaiRow as Record<string, unknown> | null);
    if (p) return p;
  }
  if (input.preferredProvider === "Claude") {
    const p = pick(claudeRow as Record<string, unknown> | null);
    if (p) return p;
  }

  const openai = pick(openaiRow as Record<string, unknown> | null);
  if (openai) return openai;
  const claude = pick(claudeRow as Record<string, unknown> | null);
  if (claude) return claude;

  return {
    provider: "Stub",
    model: DEFAULT_AI_MODEL,
    fallbackToStub: true,
  };
}
