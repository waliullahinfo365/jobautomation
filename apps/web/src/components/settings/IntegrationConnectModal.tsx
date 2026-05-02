"use client";

import { AI_MODEL_OPTIONS } from "@/constants/aiModels";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  providerSlug: string | null;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
  initialEmail?: string;
  initialAccountName?: string;
  /** Gmail / Drive / Calendar: optional OAuth redirect (stub or real Google URL). */
  onGoogleConnect?: () => void | Promise<void>;
  googleConnectLoading?: boolean;
};

export function IntegrationConnectModal({
  open,
  providerSlug,
  onClose,
  onSubmit,
  loading,
  initialEmail,
  initialAccountName,
  onGoogleConnect,
  googleConnectLoading,
}: Props) {
  const [connectedEmail, setConnectedEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [from, setFrom] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [channelName, setChannelName] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [notionWorkspace, setNotionWorkspace] = useState("");
  const [fallbackToStub, setFallbackToStub] = useState(true);

  const aiModelChoices = useMemo(() => {
    if (!providerSlug || (providerSlug !== "openai" && providerSlug !== "claude")) return [];
    return AI_MODEL_OPTIONS.filter((m) => m.provider === providerSlug);
  }, [providerSlug]);

  useEffect(() => {
    if (!open || !providerSlug) return;
    setConnectedEmail(initialEmail ?? "");
    setAccountName(initialAccountName ?? "");
    const defaultModel =
      providerSlug === "claude"
        ? AI_MODEL_OPTIONS.find((m) => m.provider === "claude")?.model ?? "claude-3-5-haiku-latest"
        : AI_MODEL_OPTIONS.find((m) => m.provider === "openai" && m.model === "gpt-4o-mini")?.model ??
          AI_MODEL_OPTIONS.find((m) => m.provider === "openai")?.model ??
          "gpt-4o-mini";
    setModel(defaultModel);
    setFallbackToStub(true);
    setApiKey("");
    setHost("smtp.example.com");
    setPort("587");
    setSecure(false);
    setSmtpUser("noreply");
    setFrom("noreply@example.com");
    setWorkspaceName("Demo Workspace");
    setChannelName("#jobflow-alerts");
    setDatabaseName("Job Pipeline — Legacy");
    setNotionWorkspace("Legacy Teamspace");
  }, [open, providerSlug, initialEmail, initialAccountName]);

  const primaryLabel = useMemo(() => {
    if (!providerSlug) return "Save";
    if (providerSlug === "gmail" || providerSlug === "google-drive" || providerSlug === "google-calendar") return "Connect Demo";
    if (providerSlug === "openai" || providerSlug === "claude") return "Save Demo Config";
    if (providerSlug === "smtp") return "Save SMTP Demo Config";
    if (providerSlug === "slack") return "Save Slack Demo Config";
    if (providerSlug === "notion-legacy") return "Save Legacy Import Config";
    return "Save";
  }, [providerSlug]);

  if (!open || !providerSlug) return null;

  const googleBlock =
    providerSlug === "gmail" || providerSlug === "google-drive" || providerSlug === "google-calendar";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (providerSlug === "gmail" || providerSlug === "google-drive" || providerSlug === "google-calendar") {
      await onSubmit({
        connectedEmail: connectedEmail || undefined,
        accountName: accountName || undefined,
        config: {},
      });
      return;
    }
    if (providerSlug === "openai" || providerSlug === "claude") {
      await onSubmit({
        config: {
          provider: providerSlug === "openai" ? "OpenAI" : "Claude",
          model,
          fallbackToStub,
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        },
      });
      return;
    }
    if (providerSlug === "smtp") {
      const portNum = Number.parseInt(port, 10);
      await onSubmit({
        config: {
          host,
          port: Number.isFinite(portNum) ? portNum : 587,
          secure,
          user: smtpUser,
          from,
        },
      });
      return;
    }
    if (providerSlug === "slack") {
      await onSubmit({
        config: {
          workspaceName,
          channelName,
        },
      });
      return;
    }
    if (providerSlug === "notion-legacy") {
      await onSubmit({
        config: {
          workspaceName: notionWorkspace,
          databaseName,
        },
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Connect integration</h2>
        <p className="mt-1 text-sm text-muted-foreground capitalize">{providerSlug.replace(/-/g, " ")}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {googleBlock ? (
            <>
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                OAuth will be connected in production. This demo stores a stub connection only—no Google API calls are made.
              </p>
              {onGoogleConnect ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => void onGoogleConnect()}
                  disabled={loading || googleConnectLoading}
                >
                  {googleConnectLoading ? "Opening Google…" : "Connect with Google"}
                </Button>
              ) : null}
              <p className="text-center text-xs text-muted-foreground">or use offline demo</p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Connected email</p>
                <Input value={connectedEmail} onChange={(e) => setConnectedEmail(e.target.value)} placeholder="you@company.com" type="email" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Account name</p>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Primary workspace" />
              </div>
            </>
          ) : null}

          {(providerSlug === "openai" || providerSlug === "claude") && (
            <>
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                API keys are masked after save and never shown again in full.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Model</p>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {aiModelChoices.map((m) => (
                    <option key={m.model} value={m.model}>
                      {m.label} ({m.model})
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={fallbackToStub} onChange={(e) => setFallbackToStub(e.target.checked)} />
                Prefer deterministic stub (no external AI call)
              </label>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">API key</p>
                <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." type="password" autoComplete="off" />
              </div>
            </>
          )}

          {providerSlug === "smtp" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Host</p>
                  <Input value={host} onChange={(e) => setHost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Port</p>
                  <Input value={port} onChange={(e) => setPort(e.target.value)} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} />
                Secure (TLS)
              </label>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">User</p>
                <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">From</p>
                <Input value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
            </>
          )}

          {providerSlug === "slack" && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Workspace name</p>
                <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Channel name</p>
                <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} />
              </div>
            </>
          )}

          {providerSlug === "notion-legacy" && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Database name</p>
                <Input value={databaseName} onChange={(e) => setDatabaseName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Workspace name</p>
                <Input value={notionWorkspace} onChange={(e) => setNotionWorkspace(e.target.value)} />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading || googleConnectLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || googleConnectLoading}>
              {primaryLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
