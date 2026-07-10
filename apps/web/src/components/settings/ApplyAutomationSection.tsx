"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { createAgentPairingCode, getAgentStatus, type AgentStatus } from "@/lib/api/apply-agent.api";
import { ApiError } from "@/lib/api/client";
import { showError, showSuccess } from "@/lib/ui/toast";
import { copyTextToClipboard } from "@/lib/utils/mobile-apply";
import { env } from "@/config/env";

export function ApplyAutomationSection() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpires, setPairingExpires] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await getAgentStatus();
      setStatus(s);
    } catch {
      setStatus({ connected: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleGenerateCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await createAgentPairingCode("Desktop Apply Agent");
      setPairingCode(res.code);
      setPairingExpires(res.expiresAt);
      showSuccess(t("applyAutomation.codeGenerated"));
    } catch (e) {
      const message =
        e instanceof ApiError && e.status === 403
          ? t("applyAutomation.permissionDenied")
          : e instanceof Error
            ? e.message
            : t("applyAutomation.codeFailed");
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("applyAutomation.title")}</CardTitle>
        <CardDescription>{t("applyAutomation.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-3)] p-3 space-y-2">
          <p className="font-medium">{t("applyAutomation.agentTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("applyAutomation.agentBody")}</p>
          {status?.connected ? (
            <p className="text-xs text-emerald-600">
              {t("applyAutomation.agentOnline")} — {status.deviceName}
              {status.lastHeartbeat ? ` · ${new Date(status.lastHeartbeat).toLocaleString()}` : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("applyAutomation.agentOffline")}</p>
          )}
          {pairingCode ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <code className="rounded bg-muted px-2 py-1 text-lg font-bold tracking-widest">{pairingCode}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void copyTextToClipboard(pairingCode).then((ok) => {
                    if (ok) showSuccess(t("common.copied"));
                  });
                }}
              >
                {t("common.copy")}
              </Button>
              {pairingExpires ? (
                <span className="text-xs text-muted-foreground">
                  {t("applyAutomation.expires")} {new Date(pairingExpires).toLocaleTimeString()}
                </span>
              ) : null}
            </div>
          ) : null}
          {error ? (
            <p className="rounded-md border border-[var(--rose-ring)] bg-[var(--rose-bg)] px-3 py-2 text-xs text-[var(--text-2)]">
              {error}
            </p>
          ) : null}
          <pre className="overflow-x-auto rounded bg-muted p-2 text-[11px] text-muted-foreground">
            {`pnpm --filter @jobflow/apply-agent start pair --code ${pairingCode ?? "123456"} --api-url ${env.api.url}`}
          </pre>
          <Button type="button" size="sm" disabled={loading} onClick={() => void handleGenerateCode()}>
            {loading ? t("applyAutomation.generating") : t("applyAutomation.generateCode")}
          </Button>
        </div>

        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-3)] p-3 space-y-2">
          <p className="font-medium">{t("applyAutomation.extensionTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("applyAutomation.extensionBody")}</p>
          <p className="text-xs font-mono text-muted-foreground">extensions/linkedin-apply-assistant/</p>
        </div>
      </CardContent>
    </Card>
  );
}
