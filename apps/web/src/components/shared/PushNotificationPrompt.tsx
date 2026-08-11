"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { subscribeToWebPush } from "@/lib/api/push.api";
import { showError, showSuccess } from "@/lib/ui/toast";

export function PushNotificationPrompt() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted" || Notification.permission === "denied") return;
    const dismissed = localStorage.getItem("push_prompt_dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-[var(--text-1)]">{t("notifications.push.title")}</p>
        <p className="text-xs text-muted-foreground">{t("notifications.push.description")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          size="sm"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            void subscribeToWebPush()
              .then((ok) => {
                if (ok) {
                  showSuccess(t("notifications.push.enabled"));
                  setVisible(false);
                } else {
                  showError(t("notifications.push.failed"));
                }
              })
              .finally(() => setLoading(false));
          }}
        >
          {loading ? t("notifications.push.enabling") : t("notifications.push.enable")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            localStorage.setItem("push_prompt_dismissed", "1");
            setVisible(false);
          }}
        >
          {t("common.notNow")}
        </Button>
      </div>
    </div>
  );
}
