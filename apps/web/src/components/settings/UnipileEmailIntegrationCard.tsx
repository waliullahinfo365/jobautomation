"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import {
  createUnipileConnectLink,
  disconnectUnipile,
  getUnipileStatus,
  scanUnipileEmails,
  type UnipileStatus,
} from "@/lib/api/unipile.api";
import { ApiError } from "@/lib/api/client";
import { showError, showSuccess } from "@/lib/ui/toast";

export function UnipileEmailIntegrationCard() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<UnipileStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await getUnipileStatus();
      setStatus(s);
    } catch {
      setStatus({ connected: false, configured: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const flag = searchParams.get("unipile");
    if (flag === "connected") {
      showSuccess(t("integrations.unipile.connectedToast"));
      void refresh();
    } else if (flag === "failed") {
      showError(t("integrations.unipile.failedToast"));
      setError(t("integrations.unipile.failedToast"));
    }
  }, [searchParams, refresh, t]);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const res = await createUnipileConnectLink();
      if (!res.url) throw new Error(t("integrations.unipile.connectFailed"));
      window.location.assign(res.url);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : t("integrations.unipile.connectFailed");
      setError(message);
      showError(message);
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    setError(null);
    try {
      await disconnectUnipile();
      showSuccess(t("integrations.unipile.disconnectedToast"));
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : t("integrations.unipile.disconnectFailed");
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await scanUnipileEmails({ limit: 30 });
      showSuccess(
        `${t("integrations.unipile.scanSuccess")}: ${res.processed} processed, ${res.created} jobs`
      );
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : t("integrations.unipile.scanFailed");
      setError(message);
      showError(message);
    } finally {
      setScanning(false);
    }
  }

  const connected = Boolean(status?.connected);
  const configured = status?.configured !== false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("integrations.unipile.title")}</CardTitle>
        <CardDescription>{t("integrations.unipile.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{t("integrations.unipile.body")}</p>

        {!configured ? (
          <p className="rounded-md border border-[var(--rose-ring)] bg-[var(--rose-bg)] px-3 py-2 text-xs">
            {t("integrations.unipile.notConfigured")}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-[var(--rose-ring)] bg-[var(--rose-bg)] px-3 py-2 text-xs text-[var(--text-2)]">
            {error}
          </p>
        ) : null}

        {connected ? (
          <p className="text-xs text-emerald-600">
            {t("integrations.unipile.connected")}
            {status?.connectedEmail ? ` — ${status.connectedEmail}` : ""}
            {status?.lastSyncAt ? ` · ${new Date(status.lastSyncAt).toLocaleString()}` : ""}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("integrations.unipile.notConnected")}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <Button type="button" size="sm" disabled={loading || !configured} onClick={() => void handleConnect()}>
              {loading ? t("integrations.unipile.connecting") : t("integrations.unipile.connect")}
            </Button>
          ) : (
            <>
              <Button type="button" size="sm" disabled={scanning} onClick={() => void handleScan()}>
                {scanning ? t("integrations.unipile.scanning") : t("integrations.unipile.scanNow")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void handleDisconnect()}>
                {t("integrations.unipile.disconnect")}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
