"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkedinIcon } from "@/components/icons/moreIcons";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { LinkedInLoginModal } from "./LinkedInLoginModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  startLinkedInLogin,
  getLinkedInSessionStatus,
  deleteLinkedInSession,
  importLinkedInCookies,
  type LinkedInSessionStatus,
} from "@/lib/api/linkedin-session.api";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";

const POLL_INTERVAL_MS = 4_000;
const POLL_MAX_ATTEMPTS = 20; // ~80 seconds total

export function LinkedInSessionCard() {
  const [status, setStatus] = useState<LinkedInSessionStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const s = await getLinkedInSessionStatus();
      setStatus(s);
    } catch {
      // ignore — API may be loading
    }
  }

  useEffect(() => {
    void fetchStatus();
  }, []);

  async function pollForSession(attempts = 0): Promise<void> {
    if (attempts >= POLL_MAX_ATTEMPTS) {
      setPolling(false);
      setConnecting(false);
      const msg = "LinkedIn login timed out. Please check your credentials and try again.";
      setLoginError(msg);
      showError(msg);
      return;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    try {
      const s = await getLinkedInSessionStatus();

      // Success
      if (s.connected) {
        setStatus(s);
        setLoginError(null);
        setPolling(false);
        setConnecting(false);
        showSuccess("LinkedIn connected! Your session is now active.");
        return;
      }

      // Job failed — stop polling immediately and surface the error
      if (s.loginAttemptStatus === "failed" && s.loginError) {
        setPolling(false);
        setConnecting(false);
        setLoginError(s.loginError);
        showError("LinkedIn login failed — see details below.");
        return;
      }
    } catch {
      // keep polling on network errors
    }

    await pollForSession(attempts + 1);
  }

  async function handleLogin(email: string, password: string) {
    setLoginError(null);
    try {
      setConnecting(true);
      const result = await startLinkedInLogin(email, password);

      if (result.status === "skipped") {
        setConnecting(false);
        showInfo(result.message);
        return;
      }

      setModalOpen(false);
      setPolling(true);
      showInfo("Login job queued — connecting to LinkedIn… this takes ~20 seconds.");
      await pollForSession();
    } catch (e) {
      setConnecting(false);
      setPolling(false);
      showError(e instanceof Error ? e.message : "Failed to start LinkedIn login.");
    }
  }

  async function handleCookieImport(cookieJson: string) {
    setLoginError(null);
    try {
      setConnecting(true);
      const result = await importLinkedInCookies(cookieJson);
      setConnecting(false);
      if (result.connected) {
        await fetchStatus();
        setModalOpen(false);
        showSuccess(`LinkedIn session imported (${result.cookieCount} cookies). You're connected!`);
      }
    } catch (e) {
      setConnecting(false);
      const msg = e instanceof Error ? e.message : "Failed to import cookies.";
      setLoginError(msg);
      showError(msg);
    }
  }

  async function handleDisconnect() {
    try {
      await deleteLinkedInSession();
      setStatus({ connected: false, savedAt: null });
      showSuccess("LinkedIn session removed.");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to disconnect.");
    } finally {
      setDisconnectOpen(false);
    }
  }

  const cardStatus = polling
    ? "Needs Attention"
    : status?.connected
      ? "Connected"
      : loginError
        ? "Needs Attention"
        : "Not Connected";

  const savedAt = status?.savedAt
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(status.savedAt)
      )
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <LinkedinIcon size={32} className="shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <CardTitle className="text-base">LinkedIn</CardTitle>
                <CardDescription className="mt-1">
                  Automated Easy Apply — log in once to enable one-click job applications.
                </CardDescription>
              </div>
            </div>
            <ConnectionStatusBadge status={cardStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {polling ? (
            <p className="text-sm text-muted-foreground animate-pulse">
              Connecting to LinkedIn… please wait (~20 s)
            </p>
          ) : status?.connected ? (
            <div>
              <p className="text-xs text-muted-foreground">Session saved</p>
              <p>{savedAt ?? "Active"}</p>
            </div>
          ) : loginError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="font-semibold mb-1">Login failed</p>
              <p className="whitespace-pre-wrap">{loginError}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              No active session. Connect to enable automated job applications via LinkedIn Easy Apply.
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setModalOpen(true)}
              disabled={connecting || polling}
            >
              {status?.connected ? "Reconnect" : "Connect LinkedIn"}
            </Button>
            {status?.connected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisconnectOpen(true)}
                disabled={connecting || polling}
              >
                Disconnect
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <LinkedInLoginModal
        open={modalOpen}
        loading={connecting}
        onClose={() => {
          if (!connecting) setModalOpen(false);
        }}
        onSubmitCredentials={handleLogin}
        onSubmitCookies={handleCookieImport}
      />

      <ConfirmDialog
        open={disconnectOpen}
        title="Disconnect LinkedIn"
        description="This will remove the saved LinkedIn session. You will need to log in again to use auto-apply."
        confirmLabel="Disconnect"
        variant="destructive"
        onCancel={() => setDisconnectOpen(false)}
        onConfirm={() => void handleDisconnect()}
      />
    </>
  );
}
