"use client";

import type { IntegrationHealthSummary, IntegrationListItem, IntegrationTestResult } from "@/types/integrations";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAiApi } from "@/hooks/api/useAiApi";
import { useIntegrationsApi } from "@/hooks/api/useIntegrationsApi";
import { getGoogleAuthUrl, testSmtpIntegration } from "@/lib/api/integrations.api";
import { ApiError, getAuthToken } from "@/lib/api/client";
import { shouldUseMockFallback } from "@/lib/api/mockFallback";
import { showError, showInfo, showSuccess } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { IntegrationCard } from "./IntegrationCard";
import { IntegrationConnectModal } from "./IntegrationConnectModal";
import { LinkedInSessionCard } from "./LinkedInSessionCard";

function summarizeHealth(items: IntegrationListItem[]): IntegrationHealthSummary {
  const summary: IntegrationHealthSummary = {
    connected: 0,
    needsAttention: 0,
    notConnected: 0,
    expired: 0,
    disabled: 0,
  };
  for (const i of items) {
    switch (i.status) {
      case "Connected":
        summary.connected += 1;
        break;
      case "Needs Attention":
        summary.needsAttention += 1;
        break;
      case "Not Connected":
        summary.notConnected += 1;
        break;
      case "Expired":
        summary.expired += 1;
        break;
      case "Disabled":
        summary.disabled += 1;
        break;
      default:
        summary.notConnected += 1;
    }
  }
  return summary;
}

function maskSecret(raw: string): string {
  const t = raw.trim();
  if (t.length <= 8) return "••••••••";
  return `${t.slice(0, 3)}••••${t.slice(-4)}`;
}

function sanitizeConfigForLocalPreview(cfg?: Record<string, unknown>): Record<string, unknown> {
  if (!cfg) return {};
  const next = { ...cfg };
  if (typeof next.password === "string" && typeof next.pass !== "string") {
    next.pass = next.password;
    delete next.password;
  }
  if (typeof next.apiKey === "string") {
    next.apiKeyPreview = maskSecret(next.apiKey as string);
    delete next.apiKey;
  }
  if (typeof next.password === "string") {
    next.passwordPreview = maskSecret(next.password as string);
    delete next.password;
  }
  if (typeof next.pass === "string") {
    delete next.pass;
    next.smtpPasswordSaved = true;
  }
  return next;
}

function buildLocalConnectPatch(slug: string, body: Record<string, unknown>): Partial<IntegrationListItem> {
  const cfg = body.config as Record<string, unknown> | undefined;
  const isGoogle = slug === "gmail" || slug === "google-drive" || slug === "google-calendar";
  return {
    status: isGoogle ? "Needs Attention" : "Connected",
    connectedEmail: body.connectedEmail as string | undefined,
    accountName: body.accountName as string | undefined,
    lastSyncAt: new Date().toISOString(),
    syncStatus: "OK",
    errorMessage: undefined,
    scopes: Array.isArray(body.scopes) ? (body.scopes as string[]) : [],
    metadata: {
      demoConnection: isGoogle,
      reconnectRequired: isGoogle,
      ...(isGoogle ? { provider: slug } : {}),
      connectedAt: new Date().toISOString(),
      ...sanitizeConfigForLocalPreview(cfg),
    },
  };
}

function buildLocalDisconnectPatch(): Partial<IntegrationListItem> {
  return {
    status: "Disabled",
    connectedEmail: undefined,
    accountName: undefined,
    lastSyncAt: undefined,
    syncStatus: undefined,
    errorMessage: undefined,
    scopes: [],
    metadata: { disconnectedAt: new Date().toISOString() },
    lastTest: undefined,
  };
}

function stubOfflineTest(item: IntegrationListItem): IntegrationTestResult {
  const checkedAt = new Date().toISOString();
  const p = item.provider;
  if (item.status === "Connected") {
    const isGoogle = item.slug === "gmail" || item.slug === "google-drive" || item.slug === "google-calendar";
    if (isGoogle && (item.metadata?.demoConnection === true || item.metadata?.reconnectRequired === true)) {
      return {
        provider: p,
        status: "Warning",
        message: "Google OAuth demo connection detected. Configure live Google OAuth and reconnect.",
        checkedAt,
        metadata: { stub: true, demoConnection: true, reconnectRequired: true, provider: item.slug },
      };
    }
    return {
      provider: p,
      status: "Success",
      message: `${p} demo connection healthy (no external API call).`,
      checkedAt,
      metadata: { stub: true },
    };
  }
  if (item.status === "Not Connected") {
    return {
      provider: p,
      status: "Warning",
      message: `${p} is not connected — connect before production use.`,
      checkedAt,
      metadata: { stub: true },
    };
  }
  if (item.status === "Needs Attention" || item.status === "Expired") {
    return {
      provider: p,
      status: "Failed",
      message: `${p} requires attention or re-authentication (stub).`,
      checkedAt,
      metadata: { stub: true },
    };
  }
  return {
    provider: p,
    status: "Warning",
    message: `${p} is disabled or inactive for this workspace.`,
    checkedAt,
    metadata: { stub: true },
  };
}

interface GmailScanSummary {
  purged?: number;
  scanned: number;
  processed: number;
  created: number;
  skipped: number;
  failed: number;
  scanErrors: string[];
  intakeErrors: string[];
}

function GmailScanPanel() {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<GmailScanSummary | null>(null);
  const [daysBack, setDaysBack] = useState(14);
  const [purgeJunk, setPurgeJunk] = useState(true);

  const run = async () => {
    setScanning(true);
    setResult(null);
    try {
      const data = await apiFetch<GmailScanSummary>("/integrations/gmail/scan-inbox", {
        method: "POST",
        body: { daysBack, maxMessages: 100, purgeJunk },
        timeoutMs: 120_000,
      });
      setResult(data);
      const purgedMsg = data.purged ? ` Removed ${data.purged} junk.` : "";
      showSuccess(`Scan complete — ${data.created} new job${data.created !== 1 ? "s" : ""} added.${purgedMsg}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Scan failed. Check Gmail is connected.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-1)]">{t("integrations.gmailScan.title")}</p>
          <p className="text-xs text-[var(--text-2)]">{t("integrations.gmailScan.description")}</p>
          <p className="text-xs text-[var(--text-3)] border-l-2 border-[var(--accent-ring)] pl-2">
            {t("integrations.gmailScan.automatedHint")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs text-[var(--text-2)] cursor-pointer">
            <input
              type="checkbox"
              checked={purgeJunk}
              onChange={(e) => setPurgeJunk(e.target.checked)}
              disabled={scanning}
              className="rounded"
            />
            {t("integrations.gmailScan.removeJunkFirst")}
          </label>
          <select
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-xs text-[var(--text-1)] focus:outline-none"
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            disabled={scanning}
          >
            <option value={3}>Last 3 days</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <Button size="sm" onClick={() => void run()} disabled={scanning}>
            {scanning ? t("integrations.gmailScan.scanning") : t("integrations.gmailScan.scanNow")}
          </Button>
        </div>
      </div>

      {result && (
        <div className="rounded-lg bg-[var(--bg-1)] border border-[var(--border-default)] p-3 text-xs space-y-1">
          <div className="flex gap-4 flex-wrap">
            {(result.purged ?? 0) > 0 && <span className="text-orange-500">Removed: <strong>{result.purged}</strong></span>}
            <span className="text-[var(--text-2)]">Scanned: <strong className="text-[var(--text-1)]">{result.scanned}</strong></span>
            <span className="text-green-600">Added: <strong>{result.created}</strong></span>
            <span className="text-[var(--text-2)]">Skipped: <strong>{result.skipped}</strong></span>
            {result.failed > 0 && <span className="text-red-500">Errors: <strong>{result.failed}</strong></span>}
          </div>
          {result.intakeErrors.slice(0, 3).map((e, i) => (
            <p key={i} className="text-red-400 truncate">{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function isGoogleSlug(slug: string): boolean {
  return slug === "gmail" || slug === "google-drive" || slug === "google-calendar";
}

export function IntegrationsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const {
    integrations,
    health,
    refetch,
    connect,
    disconnect,
    test,
    telegramStatus,
    testTelegram,
    isUsingFallback,
    integrationsLoading,
    integrationsError,
    resendStatus,
    testResend,
  } = useIntegrationsApi({ fallbackToMock: false });

  const aiApi = useAiApi();

  const [localBySlug, setLocalBySlug] = useState<Record<string, Partial<IntegrationListItem>>>({});
  const [lastTestBySlug, setLastTestBySlug] = useState<Record<string, IntegrationTestResult>>({});
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const [disconnectSlug, setDisconnectSlug] = useState<string | null>(null);
  const [pending, setPending] = useState<{ slug: string; action: "connect" | "test" | "disconnect" } | null>(null);
  const [googleConnectLoadingSlug, setGoogleConnectLoadingSlug] = useState<string | null>(null);
  const [googleOauthState, setGoogleOauthState] = useState<
    Record<string, { oauthEnabled: boolean; warning?: string }>
  >({});
  const oauthQueryHandled = useRef<string | null>(null);

  useEffect(() => {
    const integration = searchParams.get("integration");
    if (!integration) {
      oauthQueryHandled.current = null;
      return;
    }
    const key = searchParams.toString();
    if (oauthQueryHandled.current === key) return;
    oauthQueryHandled.current = key;
    const providerSlug = searchParams.get("provider");
    const err = searchParams.get("error");
    if (integration === "connected") {
      showSuccess(providerSlug ? t("integrations.toast.integrationConnectedWithProvider").replace("{provider}", providerSlug) : t("integrations.toast.integrationConnected"));
      void refetch();
      router.replace("/settings", { scroll: false });
    } else if (integration === "error" || err) {
      showError(err ?? t("integrations.toast.connectionFailed"));
      void refetch();
      router.replace("/settings", { scroll: false });
    }
  }, [searchParams, refetch, router]);

  const mergedItems = useMemo(() => {
    const base = integrations ?? [];
    return base.map((i) => {
      const local = localBySlug[i.slug];
      const lt = lastTestBySlug[i.slug] ?? local?.lastTest ?? i.lastTest;
      if (i.slug === "telegram" && telegramStatus) {
        const tgStatus: IntegrationListItem["status"] =
          telegramStatus.status === "disabled"
            ? "Disabled"
            : telegramStatus.status === "connected"
              ? "Connected"
              : telegramStatus.status === "needs_attention"
                ? "Needs Attention"
                : "Not Connected";
        const tgSyncStatus =
          telegramStatus.status === "disabled"
            ? "Disconnected"
            : telegramStatus.status === "connected"
              ? "Connected"
              : telegramStatus.status === "needs_attention"
                ? "Needs attention"
                : "Not configured";
        return {
          ...i,
          ...local,
          lastTest: (telegramStatus.lastTest as IntegrationTestResult | undefined) ?? lt,
          status: tgStatus,
          syncStatus: tgSyncStatus,
          errorMessage:
            telegramStatus.status === "not_configured" || telegramStatus.status === "disabled"
              ? telegramStatus.message
              : undefined,
          metadata: {
            ...(i.metadata ?? {}),
            botTokenConfigured: telegramStatus.botTokenConfigured,
            chatIdConfigured: telegramStatus.chatIdConfigured,
            lastNotificationAt: telegramStatus.lastNotificationAt,
          },
        };
      }
      if (i.slug === "resend" && resendStatus) {
        return {
          ...i,
          ...local,
          lastTest: (resendStatus.lastTest as IntegrationTestResult | undefined) ?? lt,
          status: (
            resendStatus.status === "connected"
              ? "Connected"
              : resendStatus.status === "needs_attention"
                ? "Needs Attention"
                : "Not Connected"
          ) as IntegrationListItem["status"],
          syncStatus:
            resendStatus.status === "connected"
              ? "Resend API"
              : resendStatus.status === "needs_attention"
                ? "Needs attention"
                : "Not configured",
          errorMessage:
            resendStatus.status === "not_configured"
              ? "Add RESEND_API_KEY and RESEND_FROM_EMAIL to the API environment."
              : undefined,
          metadata: {
            ...(i.metadata ?? {}),
            apiKeyConfigured: resendStatus.apiKeyConfigured,
            fromEmailConfigured: resendStatus.fromEmailConfigured,
          },
        };
      }
      return { ...i, ...local, lastTest: lt };
    });
  }, [integrations, localBySlug, lastTestBySlug, telegramStatus, resendStatus]);

  const healthSummary = useMemo(() => {
    if (health) return health;
    return summarizeHealth(mergedItems);
  }, [health, mergedItems]);

  const modalItem = modalSlug ? mergedItems.find((i) => i.slug === modalSlug) : undefined;

  async function handleConnectSubmit(body: Record<string, unknown>) {
    if (!modalSlug) return;
    const slug = modalSlug;
    try {
      setPending({ slug, action: "connect" });
      await connect({ provider: slug, body });
      await refetch();
      setLocalBySlug((o) => {
        const n = { ...o };
        delete n[slug];
        return n;
      });
      showSuccess(t("integrations.toast.integrationSaved"));
      setModalSlug(null);
    } catch (e) {
      if (shouldUseMockFallback(e)) {
        setLocalBySlug((o) => ({ ...o, [slug]: buildLocalConnectPatch(slug, body) }));
        showInfo(t("integrations.toast.apiOfflineUpdatedLocally"));
        setModalSlug(null);
      } else {
        showError(e instanceof Error ? e.message : t("integrations.toast.failedToSave"));
      }
    } finally {
      setPending(null);
    }
  }

  async function runTest(slug: string) {
    const item = mergedItems.find((i) => i.slug === slug);
    if (!item) return;
    if (slug === "claude") {
      try {
        setPending({ slug, action: "test" });
        const r = await aiApi.testAi({ provider: "Claude" });
        showSuccess(r.summary?.slice(0, 120) ?? t("integrations.toast.aiTestOk"));
        void aiApi.refetchUsage();
        await refetch();
      } catch (e) {
        if (shouldUseMockFallback(e)) {
          showInfo(t("integrations.toast.apiOfflineAiTestSkipped"));
        } else {
          showError(e instanceof Error ? e.message : t("integrations.toast.aiTestFailed"));
        }
      } finally {
        setPending(null);
      }
      return;
    }
    if (slug === "telegram") {
      try {
        setPending({ slug, action: "test" });
        const result = await testTelegram({});
        setLastTestBySlug((o) => ({ ...o, [slug]: result }));
        if (result.status === "Success") showSuccess(result.message);
        else if (result.status === "Warning") showInfo(result.message);
        else showError(result.message);
        await refetch();
      } catch (e) {
        showError(e instanceof Error ? e.message : t("integrations.toast.telegramTestFailed"));
      } finally {
        setPending(null);
      }
      return;
    }
    if (slug === "resend") {
      try {
        setPending({ slug, action: "test" });
        const result = await testResend({});
        setLastTestBySlug((o) => ({ ...o, [slug]: result }));
        if (result.status === "Success") showSuccess(result.message);
        else if (result.status === "Warning") showInfo(result.message);
        else showError(result.message);
        await refetch();
      } catch (e) {
        showError(e instanceof Error ? e.message : t("integrations.toast.resendTestFailed"));
      } finally {
        setPending(null);
      }
      return;
    }
    if (slug === "smtp") {
      try {
        setPending({ slug, action: "test" });
        const result = await testSmtpIntegration();
        setLastTestBySlug((o) => ({ ...o, [slug]: result }));
        if (result.status === "Success") showSuccess(result.message);
        else if (result.status === "Warning") showInfo(result.message);
        else showError(result.message);
        await refetch();
      } catch (e) {
        const detail =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : t("integrations.toast.smtpTestFailed");
        showError(detail);
      } finally {
        setPending(null);
      }
      return;
    }
    try {
      setPending({ slug, action: "test" });
      const result = await test(slug);
      setLastTestBySlug((o) => ({ ...o, [slug]: result }));
      if (result.status === "Success") showSuccess(result.message);
      else if (result.status === "Warning") showInfo(result.message);
      else showError(result.message);
      await refetch();
    } catch (e) {
      const allowOfflineStub = slug !== "smtp" && shouldUseMockFallback(e);
      if (allowOfflineStub) {
        const r = stubOfflineTest(item);
        setLastTestBySlug((o) => ({ ...o, [slug]: r }));
        if (r.status === "Success") showSuccess(r.message);
        else if (r.status === "Warning") showInfo(r.message);
        else showError(r.message);
      } else {
        const detail =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : t("integrations.toast.testFailed");
        showError(detail);
      }
    } finally {
      setPending(null);
    }
  }

  async function runDisconnect(slug: string) {
    try {
      setPending({ slug, action: "disconnect" });
      await disconnect(slug);
      await refetch();
      setLocalBySlug((o) => {
        const n = { ...o };
        delete n[slug];
        return n;
      });
      setLastTestBySlug((o) => {
        const n = { ...o };
        delete n[slug];
        return n;
      });
      showSuccess(t("integrations.toast.integrationDisconnected"));
    } catch (e) {
      if (shouldUseMockFallback(e)) {
        setLocalBySlug((o) => ({ ...o, [slug]: buildLocalDisconnectPatch() }));
        showInfo(t("integrations.toast.apiOfflineUpdatedLocally"));
      } else {
        showError(e instanceof Error ? e.message : t("integrations.toast.disconnectFailed"));
      }
    } finally {
      setPending(null);
      setDisconnectSlug(null);
    }
  }

  async function handleGoogleConnect() {
    if (!modalSlug || !isGoogleSlug(modalSlug)) return;
    try {
      setGoogleConnectLoadingSlug(modalSlug);
      if (process.env.NODE_ENV !== "production") {
        const token = getAuthToken();
        console.info("[Google OAuth] starting", { provider: modalSlug, hasAuthToken: Boolean(token) });
      }
      const res = await getGoogleAuthUrl(modalSlug as "gmail" | "google-drive" | "google-calendar");
      setGoogleOauthState((s) => ({
        ...s,
        [modalSlug]: {
          oauthEnabled: res.oauthEnabled,
          warning: res.oauthEnabled
            ? undefined
            : (res.message ??
              "Google OAuth is not enabled on the API. This is only a demo connection and cannot create Drive folders, Calendar events, or read Gmail."),
        },
      }));
      const isDemoRedirect =
        !res.oauthEnabled ||
        res.authUrl.includes("/integrations/google/demo-callback") ||
        res.authUrl.includes("demo-callback");
      if (isDemoRedirect) {
        showInfo(
          res.message ??
            "Google OAuth is not enabled on the API. This is only a demo connection and cannot create Drive folders, Calendar events, or read Gmail."
        );
        return;
      }
      window.location.href = res.authUrl;
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        const msg = e instanceof Error ? e.message : "failed";
        console.warn("[Google OAuth]", msg);
      }
      showError(t("integrations.toast.couldNotStartGoogleOAuth"));
      setGoogleConnectLoadingSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t("settings.integrationsTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("settings.integrationsSubtitle")}</p>
          {integrationsError ? (
            <p className="mt-2 text-sm text-destructive">
              {integrationsError.message}
              {" · "}
              {t("integrations.showingOfflineDemo")}
            </p>
          ) : null}
        </div>
        <ApiStatusIndicator usingMock={isUsingFallback} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-4">
        <HealthMini label={t("integrations.connected")} value={healthSummary.connected} />
        <HealthMini label={t("integrations.needsAttention")} value={healthSummary.needsAttention} />
        <HealthMini label={t("integrations.notConnected")} value={healthSummary.notConnected} />
        <HealthMini label={t("integrations.expiredDisabled")} value={healthSummary.expired + healthSummary.disabled} />
      </div>

      {integrationsLoading && !integrations?.length ? (
        <p className="text-sm text-muted-foreground">{t("integrations.loading")}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LinkedInSessionCard />
        {mergedItems.map((item) => (
          <IntegrationCard
            key={item.slug}
            item={item}
            pending={pending}
            onConnect={() => setModalSlug(item.slug)}
            onTest={() => void runTest(item.slug)}
            onDisconnect={() => setDisconnectSlug(item.slug)}
          />
        ))}
      </div>

      {/* Gmail Inbox Scan — shown when Gmail is connected */}
      {mergedItems.some((i) => i.slug === "gmail" && i.status === "Connected") && (
        <GmailScanPanel />
      )}

      <IntegrationConnectModal
        open={modalSlug !== null}
        providerSlug={modalSlug}
        onClose={() => setModalSlug(null)}
        onSubmit={handleConnectSubmit}
        loading={pending?.action === "connect"}
        initialEmail={modalItem?.connectedEmail}
        initialAccountName={modalItem?.accountName}
        onGoogleConnect={modalSlug && isGoogleSlug(modalSlug) ? () => void handleGoogleConnect() : undefined}
        googleConnectLoading={modalSlug !== null && googleConnectLoadingSlug === modalSlug}
        showLiveGoogleOAuthCopy={!isUsingFallback}
        initialSmtp={
          modalSlug === "smtp" && modalItem?.metadata
            ? {
                host: typeof modalItem.metadata.host === "string" ? modalItem.metadata.host : undefined,
                port: (() => {
                  const p = modalItem.metadata?.port;
                  if (typeof p === "number" && Number.isFinite(p)) return p;
                  if (typeof p === "string") {
                    const n = Number.parseInt(p, 10);
                    return Number.isFinite(n) ? n : undefined;
                  }
                  return undefined;
                })(),
                secure: modalItem.metadata.secure === true,
                user: typeof modalItem.metadata.user === "string" ? modalItem.metadata.user : undefined,
                from: typeof modalItem.metadata.from === "string" ? modalItem.metadata.from : undefined,
                fromName: typeof modalItem.metadata.fromName === "string" ? modalItem.metadata.fromName : undefined,
              }
            : undefined
        }
        googleOAuthEnabled={modalSlug ? googleOauthState[modalSlug]?.oauthEnabled ?? null : null}
        googleOAuthWarning={modalSlug ? googleOauthState[modalSlug]?.warning ?? null : null}
      />

      <ConfirmDialog
        open={disconnectSlug !== null}
        title={t("integrations.confirm.disconnectTitle")}
        description={t("integrations.confirm.disconnectDescription")}
        confirmLabel={t("integrations.confirm.disconnectConfirm")}
        variant="destructive"
        onCancel={() => setDisconnectSlug(null)}
        onConfirm={() => {
          if (disconnectSlug) void runDisconnect(disconnectSlug);
        }}
      />
    </div>
  );
}

function HealthMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
