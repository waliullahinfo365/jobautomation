import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "../services/baseTenant.service";
import { enqueueAutomationModule } from "../services/automation-queue.service";
import { IntegrationConnectionModel } from "@jobflow/database/models";

/** POST /integrations/linkedin/session — enqueue headless login */
export const startLinkedInLogin = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim()) throw new ApiError("Email is required", 422, "VALIDATION_ERROR");
  if (!password?.trim()) throw new ApiError("Password is required", 422, "VALIDATION_ERROR");

  const result = await enqueueAutomationModule({
    moduleKey: "linkedin-login",
    tenantId,
    userId,
    payload: { email: email.trim(), password },
    source: "api",
  });

  return successResponse(res, {
    operationId: result.operationId,
    status: result.status,
    message: "Login job queued. Session will be ready in ~15 seconds.",
  }, "LinkedIn login queued");
});

/** POST /integrations/linkedin/session/cookies — import cookies exported from browser */
export const importLinkedInCookies = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const { cookies, proxyUrl: bodyProxy } = req.body as { cookies?: unknown; proxyUrl?: string | null };

  if (!cookies) throw new ApiError("cookies field is required", 422, "VALIDATION_ERROR");

  // Accept either a JSON string or already-parsed array
  let parsed: unknown;
  if (typeof cookies === "string") {
    try { parsed = JSON.parse(cookies); } catch {
      throw new ApiError("cookies must be valid JSON", 422, "VALIDATION_ERROR");
    }
  } else {
    parsed = cookies;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new ApiError("cookies must be a non-empty array", 422, "VALIDATION_ERROR");
  }

  // Validate at least one LinkedIn cookie is present
  const hasLinkedIn = (parsed as Array<Record<string, unknown>>).some(
    (c) => typeof c.name === "string" && typeof c.value === "string" &&
      (String(c.domain ?? "").includes("linkedin.com") || c.name === "li_at" || c.name === "JSESSIONID")
  );
  if (!hasLinkedIn) {
    throw new ApiError(
      "No LinkedIn cookies found. Make sure you export cookies from linkedin.com (look for li_at cookie).",
      422,
      "VALIDATION_ERROR"
    );
  }

  // Normalise cookie format to Playwright storageState shape
  const normalised = (parsed as Array<Record<string, unknown>>).map((c) => ({
    name: String(c.name ?? ""),
    value: String(c.value ?? ""),
    domain: String(c.domain ?? ".linkedin.com"),
    path: String(c.path ?? "/"),
    expires: typeof c.expirationDate === "number" ? c.expirationDate :
              typeof c.expires === "number" ? c.expires : -1,
    httpOnly: Boolean(c.httpOnly ?? false),
    secure: Boolean(c.secure ?? true),
    sameSite: (["Strict", "Lax", "None"].includes(String(c.sameSite ?? "")) ? c.sameSite : "None") as "Strict" | "Lax" | "None",
  }));

  const { saveSession } = await import("@jobflow/integrations/playwright/session-store");
  const trimmedProxy = typeof bodyProxy === "string" ? bodyProxy.trim() : "";
  const envProxy = (process.env.PROXY_URL ?? process.env.PLAYWRIGHT_PROXY_URL ?? "").trim();
  const proxyPin = trimmedProxy
    ? ({ mode: "set" as const, url: trimmedProxy })
    : envProxy
      ? ({ mode: "set" as const, url: envProxy })
      : ({ mode: "clear" as const });

  await saveSession({
    tenantId,
    platform: "linkedin",
    storageState: { cookies: normalised, origins: [] },
    proxyPin,
    clearSessionExpiredFlags: true,
  });

  return successResponse(
    res,
    {
      connected: true,
      cookieCount: normalised.length,
      proxyPinned: trimmedProxy.length > 0 || envProxy.length > 0,
    },
    "LinkedIn cookies imported"
  );
});

/** GET /integrations/linkedin/session — check session status + latest login attempt result */
export const getLinkedInSessionStatus = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);

  const [sessionRow, attemptRow] = await Promise.all([
    IntegrationConnectionModel.findOne({
      tenantId,
      provider: "playwright-session-linkedin",
      status: "Connected",
    }).lean() as Promise<Record<string, unknown> | null>,
    IntegrationConnectionModel.findOne({
      tenantId,
      provider: "playwright-session-linkedin-attempt",
    }).lean() as Promise<Record<string, unknown> | null>,
  ]);

  const attemptMeta = (attemptRow?.metadata as Record<string, unknown>) ?? {};
  const attemptStatus = attemptRow?.syncStatus as string | undefined;
  const attemptMessage = (attemptMeta.message as string | undefined) ?? undefined;

  if (sessionRow) {
    const meta = (sessionRow.metadata as Record<string, unknown>) ?? {};
    const sessionExpired = meta.sessionExpired === true;
    return successResponse(res, {
      connected: !sessionExpired,
      sessionExpired,
      savedAt: meta.savedAt ?? sessionRow.lastSyncAt ?? null,
      proxyPinned: Boolean(meta.playwrightProxyEncrypted),
      loginError: sessionExpired ? "LinkedIn session expired. Please re-import your cookies from Settings → Integrations." : null,
    }, "LinkedIn session status");
  }

  // No active session — return attempt state so UI can show error immediately
  return successResponse(res, {
    connected: false,
    savedAt: null,
    proxyPinned: false,
    loginAttemptStatus: attemptStatus ?? null,  // "pending" | "connected" | "failed" | null
    loginError: attemptStatus === "failed" ? (attemptMessage ?? null) : null,
  }, "LinkedIn session status");
});

/** DELETE /integrations/linkedin/session — remove saved session */
export const deleteLinkedInSession = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);

  await Promise.all([
    IntegrationConnectionModel.deleteOne({ tenantId, provider: "playwright-session-linkedin" }),
    IntegrationConnectionModel.deleteOne({ tenantId, provider: "playwright-session-linkedin-attempt" }),
  ]);

  return successResponse(res, { disconnected: true }, "LinkedIn session removed");
});
