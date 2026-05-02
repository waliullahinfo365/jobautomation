"use client";

import type { IntegrationHealthSummary, IntegrationListItem, IntegrationTestResult } from "@shared/types/integration";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAiApi } from "@/hooks/api/useAiApi";
import { useIntegrationsApi } from "@/hooks/api/useIntegrationsApi";
import { getGoogleAuthUrl } from "@/lib/api/integrations.api";
import { shouldUseMockFallback } from "@/lib/api/mockFallback";
import { showError, showInfo, showSuccess } from "@/lib/ui/toast";
import { IntegrationCard } from "./IntegrationCard";
import { IntegrationConnectModal } from "./IntegrationConnectModal";

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
  if (typeof next.apiKey === "string") {
    next.apiKeyPreview = maskSecret(next.apiKey as string);
    delete next.apiKey;
  }
  if (typeof next.password === "string") {
    next.passwordPreview = maskSecret(next.password as string);
    delete next.password;
  }
  if (typeof next.pass === "string") {
    next.passPreview = maskSecret(next.pass as string);
    delete next.pass;
  }
  return next;
}

function buildLocalConnectPatch(body: Record<string, unknown>): Partial<IntegrationListItem> {
  const cfg = body.config as Record<string, unknown> | undefined;
  return {
    status: "Connected",
    connectedEmail: body.connectedEmail as string | undefined,
    accountName: body.accountName as string | undefined,
    lastSyncAt: new Date().toISOString(),
    syncStatus: "OK",
    errorMessage: undefined,
    scopes: Array.isArray(body.scopes) ? (body.scopes as string[]) : [],
    metadata: {
      stub: true,
      demoConnectedAt: new Date().toISOString(),
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
    metadata: { stub: true, disconnectedAt: new Date().toISOString() },
    lastTest: undefined,
  };
}

function stubOfflineTest(item: IntegrationListItem): IntegrationTestResult {
  const checkedAt = new Date().toISOString();
  const p = item.provider;
  if (item.status === "Connected") {
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

function isGoogleSlug(slug: string): boolean {
  return slug === "gmail" || slug === "google-drive" || slug === "google-calendar";
}

export function IntegrationsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    integrations,
    health,
    refetch,
    connect,
    disconnect,
    test,
    isUsingFallback,
    integrationsLoading,
    integrationsError,
  } = useIntegrationsApi({ fallbackToMock: true });

  const aiApi = useAiApi();

  const [localBySlug, setLocalBySlug] = useState<Record<string, Partial<IntegrationListItem>>>({});
  const [lastTestBySlug, setLastTestBySlug] = useState<Record<string, IntegrationTestResult>>({});
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const [disconnectSlug, setDisconnectSlug] = useState<string | null>(null);
  const [pending, setPending] = useState<{ slug: string; action: "connect" | "test" | "disconnect" } | null>(null);
  const [googleConnectLoadingSlug, setGoogleConnectLoadingSlug] = useState<string | null>(null);
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
      showSuccess(providerSlug ? `Integration connected: ${providerSlug}` : "Integration connected");
      void refetch();
      router.replace("/settings", { scroll: false });
    } else if (integration === "error" || err) {
      showError(err ?? "Integration connection failed");
      void refetch();
      router.replace("/settings", { scroll: false });
    }
  }, [searchParams, refetch, router]);

  const mergedItems = useMemo(() => {
    const base = integrations ?? [];
    return base.map((i) => {
      const local = localBySlug[i.slug];
      const lt = lastTestBySlug[i.slug] ?? local?.lastTest ?? i.lastTest;
      return { ...i, ...local, lastTest: lt };
    });
  }, [integrations, localBySlug, lastTestBySlug]);

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
      showSuccess("Integration saved.");
      setModalSlug(null);
    } catch (e) {
      if (shouldUseMockFallback(e)) {
        setLocalBySlug((o) => ({ ...o, [slug]: buildLocalConnectPatch(body) }));
        showInfo("API offline, updated demo integration locally.");
        setModalSlug(null);
      } else {
        showError(e instanceof Error ? e.message : "Failed to save integration");
      }
    } finally {
      setPending(null);
    }
  }

  async function runTest(slug: string) {
    const item = mergedItems.find((i) => i.slug === slug);
    if (!item) return;
    if (slug === "openai" || slug === "claude") {
      try {
        setPending({ slug, action: "test" });
        const r = await aiApi.testAi({ provider: slug === "openai" ? "OpenAI" : "Claude" });
        showSuccess(r.summary?.slice(0, 120) ?? "AI test OK");
        void aiApi.refetchUsage();
        await refetch();
      } catch (e) {
        if (shouldUseMockFallback(e)) {
          showInfo("API offline — AI test skipped.");
        } else {
          showError(e instanceof Error ? e.message : "AI test failed");
        }
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
      if (shouldUseMockFallback(e)) {
        const r = stubOfflineTest(item);
        setLastTestBySlug((o) => ({ ...o, [slug]: r }));
        if (r.status === "Success") showSuccess(r.message);
        else if (r.status === "Warning") showInfo(r.message);
        else showError(r.message);
      } else {
        showError(e instanceof Error ? e.message : "Test failed");
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
      showSuccess("Integration disconnected.");
    } catch (e) {
      if (shouldUseMockFallback(e)) {
        setLocalBySlug((o) => ({ ...o, [slug]: buildLocalDisconnectPatch() }));
        showInfo("API offline, updated demo integration locally.");
      } else {
        showError(e instanceof Error ? e.message : "Disconnect failed");
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
      const res = await getGoogleAuthUrl(modalSlug as "gmail" | "google-drive" | "google-calendar");
      window.location.href = res.authorizationUrl;
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not start Google OAuth");
      setGoogleConnectLoadingSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect providers used by automation modules. OAuth and live APIs are stubbed in this environment.
          </p>
          {integrationsError ? (
            <p className="mt-2 text-sm text-destructive">
              {integrationsError.message}
              {" · "}
              showing offline demo data where configured.
            </p>
          ) : null}
        </div>
        <ApiStatusIndicator usingMock={isUsingFallback} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <HealthMini label="Connected" value={healthSummary.connected} />
        <HealthMini label="Needs attention" value={healthSummary.needsAttention} />
        <HealthMini label="Not connected" value={healthSummary.notConnected} />
        <HealthMini label="Expired / Disabled" value={healthSummary.expired + healthSummary.disabled} />
      </div>

      {integrationsLoading && !integrations?.length ? (
        <p className="text-sm text-muted-foreground">Loading integrations…</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
      />

      <ConfirmDialog
        open={disconnectSlug !== null}
        title="Disconnect integration?"
        description="This removes the stored stub connection for this workspace. You can reconnect anytime."
        confirmLabel="Disconnect"
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
