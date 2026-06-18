/**
 * Raw HTTP client for Anthropic Messages API (no SDK dependency).
 * @see https://docs.anthropic.com/en/api/messages
 */

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

/** Fallback chain — Claude 4 model IDs current as of 2025-2026. */
const MODEL_FALLBACK_CHAIN = [
  "claude-opus-4-7",
  "claude-haiku-4-5-20251001",
] as const;

function uniqueModels(models: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of models) {
    const t = m.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Prefer ANTHROPIC_API_KEY; support legacy CLAUDE_API_KEY. */
export function resolveAnthropicApiKey(): string | undefined {
  const k = process.env.ANTHROPIC_API_KEY?.trim() || process.env.CLAUDE_API_KEY?.trim();
  return k || undefined;
}

/**
 * Model order: ANTHROPIC_MODEL env, then optional hint, then default, then fallbacks.
 */
export function buildAnthropicModelCandidates(modelHint?: string): string[] {
  const primary =
    process.env.ANTHROPIC_MODEL?.trim() || modelHint?.trim() || DEFAULT_ANTHROPIC_MODEL;
  return uniqueModels([primary, ...MODEL_FALLBACK_CHAIN]);
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** Format Anthropic error JSON or raw body — never include API key. */
export function formatAnthropicHttpError(status: number, bodyText: string): string {
  const parsed = safeParseJson(bodyText) as {
    type?: string;
    error?: { type?: string; message?: string };
    message?: string;
  } | null;
  const err = parsed?.error;
  const msg = err?.message || (typeof parsed?.message === "string" ? parsed.message : null);
  const errType = err?.type || parsed?.type || "unknown";
  if (msg) return `HTTP ${status} [${errType}]: ${msg.slice(0, 400)}`;
  return `HTTP ${status}: ${bodyText.slice(0, 400)}`;
}

function isRetryableModelError(status: number, bodyText: string): boolean {
  if (status === 404) return true;
  if (status !== 400) return false;
  const low = bodyText.toLowerCase();
  return (
    low.includes("model") ||
    low.includes("not_found") ||
    low.includes("invalid_request") ||
    low.includes("does not exist")
  );
}

/** True when Anthropic indicates the requested model ID is unknown or unavailable. */
export function isAnthropicModelNotFoundResponse(status: number, bodyText: string): boolean {
  if (status === 404) return true;
  if (status !== 400) return false;
  const low = bodyText.toLowerCase();
  return (
    (low.includes("model") && (low.includes("not_found") || low.includes("not found") || low.includes("does not exist"))) ||
    low.includes("invalid_model") ||
    (low.includes("model") && low.includes("unknown"))
  );
}

function anthropicErrorTypeForResponse(status: number, bodyText: string): "auth" | "model_not_found" | "http_error" {
  if (status === 401 || status === 403) return "auth";
  if (isAnthropicModelNotFoundResponse(status, bodyText)) return "model_not_found";
  return "http_error";
}

/** Extract user-visible assistant text from Messages API JSON. */
export function extractAssistantText(responseJson: unknown): string | null {
  const content = (responseJson as { content?: unknown })?.content;
  if (!Array.isArray(content)) return null;
  const textParts: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const b = block as { type?: string; text?: string };
    if (b.type === "text" && typeof b.text === "string" && b.text.trim()) {
      textParts.push(b.text.trim());
    }
  }
  return textParts.length > 0 ? textParts.join("\n\n") : null;
}

export type AnthropicMessagesOk = { ok: true; text: string; model: string };

export type AnthropicMessagesErr = {
  ok: false;
  status?: number;
  errorType: string;
  message: string;
  modelAttempted: string;
};

export type AnthropicMessagesResult = AnthropicMessagesOk | AnthropicMessagesErr;

export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

/**
 * POST /v1/messages with text and/or image blocks. Tries model candidates when the API returns model-not-found style errors.
 */
export async function callAnthropicMessages(input: {
  prompt: string;
  apiKey: string;
  modelCandidates: string[];
  maxTokens?: number;
  temperature?: number;
}): Promise<AnthropicMessagesResult> {
  return callAnthropicMessagesContent({
    content: [{ type: "text", text: input.prompt }],
    apiKey: input.apiKey,
    modelCandidates: input.modelCandidates,
    maxTokens: input.maxTokens,
    temperature: input.temperature,
  });
}

export async function callAnthropicMessagesContent(input: {
  content: AnthropicContentBlock[];
  apiKey: string;
  modelCandidates: string[];
  maxTokens?: number;
  temperature?: number;
}): Promise<AnthropicMessagesResult> {
  const max_tokens = input.maxTokens ?? 1200;
  const temperature = input.temperature ?? 0.2;
  let lastErr: AnthropicMessagesErr | undefined;

  for (const model of input.modelCandidates) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": input.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        temperature,
        messages: [
          {
            role: "user",
            content: input.content,
          },
        ],
      }),
    });

    const rawText = await response.text().catch(() => "");

    if (!response.ok) {
      const message = formatAnthropicHttpError(response.status, rawText);
      lastErr = {
        ok: false,
        status: response.status,
        errorType: anthropicErrorTypeForResponse(response.status, rawText),
        message,
        modelAttempted: model,
      };

      if (response.status === 401 || response.status === 403) {
        return lastErr;
      }

      if (isRetryableModelError(response.status, rawText)) {
        continue;
      }

      return lastErr;
    }

    let json: unknown;
    try {
      json = JSON.parse(rawText);
    } catch {
      return {
        ok: false,
        status: response.status,
        errorType: "parse_error",
        message: "Anthropic returned 200 but body was not valid JSON",
        modelAttempted: model,
      };
    }

    const text = extractAssistantText(json);
    if (!text) {
      return {
        ok: false,
        status: response.status,
        errorType: "empty_response",
        message: "Claude response contained no text blocks",
        modelAttempted: model,
      };
    }

    return { ok: true, text, model };
  }

  return (
    lastErr ?? {
      ok: false,
      errorType: "exhausted_models",
      message: "All Anthropic model attempts failed",
      modelAttempted: input.modelCandidates[input.modelCandidates.length - 1] ?? "unknown",
    }
  );
}
